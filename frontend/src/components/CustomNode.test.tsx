import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import CustomNode from './CustomNode'
import * as useCujStoreModule from '../store/store'
import * as cujApiModule from '../api/cujApi'

// Mock the store
jest.mock('../store/store', () => ({
  useCujStore: jest.fn()
}))

// Mock the API
jest.mock('../api/cujApi', () => ({
  linkMacroToStep: jest.fn(),
  updateMacroName: jest.fn(),
  updateStep: jest.fn()
}))

// Mock React Flow modules
jest.mock('reactflow', () => ({
  Handle: ({ type, position }: any) => <div data-testid={`handle-${type}`} />,
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' }
}))

const mockUseCujStore = useCujStoreModule.useCujStore as jest.Mock
const mockLinkMacroToStep = cujApiModule.linkMacroToStep as jest.Mock
const mockUpdateMacroName = cujApiModule.updateMacroName as jest.Mock

describe('CustomNode Component - DnD Refactor Tests', () => {
  const defaultStoreState = {
    selectedCujId: 'cuj-1',
    setNodes: jest.fn(),
    nodes: []
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCujStore.mockReturnValue(defaultStoreState)
  })

  const renderNode = (props = {}) => {
    const defaultProps = {
      id: 'step-1',
      data: {
        label: 'Step 1',
        macros: []
      },
      ...props
    }

    return render(
      <ReactFlowProvider>
        <CustomNode {...defaultProps} />
      </ReactFlowProvider>
    )
  }

  describe('DragOver Handler', () => {
    it('🟢 should prevent default on dragover event', () => {
      renderNode()

      const dropZone = screen.getByRole('region', { name: /macros zone/i })
      const event = new DragEvent('dragover', { bubbles: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

      fireEvent.dragOver(dropZone, { dataTransfer: { dropEffect: '' } as any })

      // Verify preventDefault is called in handler
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('🟢 should set dropEffect to copy', () => {
      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const mockDataTransfer = {
        dropEffect: '',
        setData: jest.fn(),
        getData: jest.fn()
      }

      fireEvent.dragOver(dropZone, { dataTransfer: mockDataTransfer as any })
      expect(mockDataTransfer.dropEffect).toBe('copy')
    })

    it('🟢 should add drag-over class on hover', () => {
      const { container } = renderNode()
      const node = container.querySelector('.custom-node')
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      expect(node).not.toHaveClass('drag-over')

      fireEvent.dragOver(dropZone, { dataTransfer: { dropEffect: '' } as any })

      // Note: state update happens asynchronously
      waitFor(() => {
        expect(node).toHaveClass('drag-over')
      })
    })
  })

  describe('Drop Handler - Valid Payload', () => {
    it('🟢 should accept valid macro payload', async () => {
      const mockNodes = [{ id: 'step-1', data: { label: 'Step 1', macros: [] } }]
      mockUseCujStore.mockReturnValue({
        ...defaultStoreState,
        nodes: mockNodes,
        setNodes: jest.fn()
      })

      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const validPayload = JSON.stringify({
        kind: 'macro',
        title: 'Macro1'
      })

      const dataTransfer = {
        getData: jest.fn((type: string) => {
          return type === 'application/reactflow' ? validPayload : null
        }),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(mockLinkMacroToStep).toHaveBeenCalledWith('cuj-1', 'step-1', {
          name: 'Macro1'
        })
      })
    })

    it('🟢 should update store immutably on drop', async () => {
      const setNodesMock = jest.fn()
      const mockNodes = [{ id: 'step-1', data: { label: 'Step 1', macros: [] } }]
      mockUseCujStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          const fullState = { ...defaultStoreState, nodes: mockNodes, setNodes: setNodesMock }
          return selector(fullState)
        }
        return { ...defaultStoreState, nodes: mockNodes, setNodes: setNodesMock }
      })

      mockLinkMacroToStep.mockResolvedValue(undefined)

      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const validPayload = JSON.stringify({
        kind: 'macro',
        title: 'NewMacro'
      })

      const dataTransfer = {
        getData: jest.fn((type: string) => {
          return type === 'application/reactflow' ? validPayload : null
        }),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(setNodesMock).toHaveBeenCalled()
        const updatedNodes = setNodesMock.mock.calls[0][0]
        expect(updatedNodes[0].data.macros).toContainEqual({ name: 'NewMacro' })
      })
    })
  })

  describe('Drop Handler - Invalid Payload', () => {
    it('🔴 should reject invalid MIME type', async () => {
      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const dataTransfer = {
        getData: jest.fn(() => null),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(mockLinkMacroToStep).not.toHaveBeenCalled()
      })
    })

    it('🔴 should warn on malformed JSON', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const dataTransfer = {
        getData: jest.fn((type: string) => {
          return type === 'application/reactflow' ? '{invalid json' : null
        }),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid JSON payload')
        )
      })

      consoleSpy.mockRestore()
    })

    it('🔴 should warn on missing kind property', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const invalidPayload = JSON.stringify({ title: 'Macro1' }) // missing kind

      const dataTransfer = {
        getData: jest.fn((type: string) => {
          return type === 'application/reactflow' ? invalidPayload : null
        }),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid macro payload')
        )
      })

      consoleSpy.mockRestore()
    })

    it('🔴 should warn on wrong kind value', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const invalidPayload = JSON.stringify({
        kind: 'step',
        title: 'Macro1'
      })

      const dataTransfer = {
        getData: jest.fn((type: string) => {
          return type === 'application/reactflow' ? invalidPayload : null
        }),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid macro payload')
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Duplicate Prevention', () => {
    it('🔴 should prevent adding duplicate macros', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const existingMacros = [{ name: 'ExistingMacro' }]

      renderNode({
        data: {
          label: 'Step 1',
          macros: existingMacros
        }
      })

      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const payload = JSON.stringify({
        kind: 'macro',
        title: 'ExistingMacro' // Same as existing
      })

      const dataTransfer = {
        getData: jest.fn((type: string) => {
          return type === 'application/reactflow' ? payload : null
        }),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('already attached')
        )
        expect(mockLinkMacroToStep).not.toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Backend Error Handling', () => {
    it('🔴 should catch backend errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Backend connection failed')
      mockLinkMacroToStep.mockRejectedValue(error)

      const mockNodes = [{ id: 'step-1', data: { label: 'Step 1', macros: [] } }]
      mockUseCujStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ ...defaultStoreState, nodes: mockNodes })
        }
        return { ...defaultStoreState, nodes: mockNodes }
      })

      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const payload = JSON.stringify({
        kind: 'macro',
        title: 'Macro1'
      })

      const dataTransfer = {
        getData: jest.fn((type: string) => {
          return type === 'application/reactflow' ? payload : null
        }),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to link macro'),
          error
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('No CUJ Selected', () => {
    it('🔴 should warn when no CUJ is selected', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      mockUseCujStore.mockReturnValue({ ...defaultStoreState, selectedCujId: null })

      renderNode()
      const dropZone = screen.getByRole('region', { name: /macros zone/i })

      const payload = JSON.stringify({
        kind: 'macro',
        title: 'Macro1'
      })

      const dataTransfer = {
        getData: jest.fn((type: string) => {
          return type === 'application/reactflow' ? payload : null
        }),
        dropEffect: ''
      }

      fireEvent.drop(dropZone, { dataTransfer: dataTransfer as any })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('no CUJ selected')
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('UI - Empty State', () => {
    it('🟢 should show empty state when no macros', () => {
      renderNode()
      expect(screen.getByText('Aucune macro')).toBeInTheDocument()
    })

    it('🟢 should list macros when present', () => {
      renderNode({
        data: {
          label: 'Step 1',
          macros: [{ name: 'Macro1' }, { name: 'Macro2' }]
        }
      })

      expect(screen.getByText('Macro1')).toBeInTheDocument()
      expect(screen.getByText('Macro2')).toBeInTheDocument()
    })
  })
})
