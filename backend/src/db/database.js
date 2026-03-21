import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'cuj-data.db')

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err)
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath)
    initializeTables()
  }
})

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON')

// Initialize tables
function initializeTables() {
  // Main CUJ table
  db.run(`
    CREATE TABLE IF NOT EXISTS cujs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      criticity TEXT DEFAULT 'bronze',
      start_step_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  // add column if database already exists
  db.run(`ALTER TABLE cujs ADD COLUMN start_step_id TEXT`, (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
      console.error('Error adding start_step_id column to cujs table:', err)
    }
  })

  // Steps table (add `data` JSON field to store arbitrary node data)
  db.run(`
    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      cuj_id TEXT NOT NULL,
      name TEXT,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cuj_id) REFERENCES cujs(id) ON DELETE CASCADE
    )
  `)

  // if the database existed prior to adding `data` column we need to alter
  db.run(`ALTER TABLE steps ADD COLUMN data TEXT`, (err) => {
    // ignore "duplicate column" error which happens if column already added
    if (err && !/duplicate column/i.test(err.message)) {
      console.error('Error adding data column to steps table:', err)
    }
  })

  // Macros table (at CUJ level)
  db.run(`
    CREATE TABLE IF NOT EXISTS macros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cuj_id TEXT NOT NULL,
      name TEXT NOT NULL,
      desc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(cuj_id, name),
      FOREIGN KEY (cuj_id) REFERENCES cujs(id) ON DELETE CASCADE
    )
  `)

  // Step macros association
  db.run(`
    CREATE TABLE IF NOT EXISTS step_macros (
      step_id TEXT NOT NULL,
      macro_id INTEGER NOT NULL,
      UNIQUE(step_id, macro_id),
      FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE,
      FOREIGN KEY (macro_id) REFERENCES macros(id) ON DELETE CASCADE
    )
  `)

  // Edges (connections between steps)
  db.run(`
    CREATE TABLE IF NOT EXISTS edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cuj_id TEXT NOT NULL,
      from_step_id TEXT NOT NULL,
      to_step_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(cuj_id, from_step_id, to_step_id),
      FOREIGN KEY (cuj_id) REFERENCES cujs(id) ON DELETE CASCADE,
      FOREIGN KEY (from_step_id) REFERENCES steps(id) ON DELETE CASCADE,
      FOREIGN KEY (to_step_id) REFERENCES steps(id) ON DELETE CASCADE
    )
  `)

  // Dynatrace pages linked to macros
  db.run(`
    CREATE TABLE IF NOT EXISTS macro_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      step_id TEXT NOT NULL,
      macro_id INTEGER NOT NULL,
      url TEXT,
      page_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE CASCADE,
      FOREIGN KEY (macro_id) REFERENCES macros(id) ON DELETE CASCADE
    )
  `)
}

// ============================================
// HELPER FUNCTIONS FOR DATABASE OPERATIONS
// ============================================

// Promisify db.run for easier async/await
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// Promisify db.get
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

// Promisify db.all
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

// ============================================
// CUJ OPERATIONS
// ============================================

export async function getAllCujs() {
  try {
    return await dbAll('SELECT id, name, criticity, created_at, updated_at FROM cujs')
  } catch (err) {
    console.error('Error fetching CUJs:', err)
    return []
  }
}

export async function getCujById(id) {
  try {
    const cuj = await dbGet('SELECT * FROM cujs WHERE id = ?', [id])
    if (!cuj) return null

    // Load related data
    const steps = await dbAll('SELECT * FROM steps WHERE cuj_id = ?', [id])
    const macros = await dbAll('SELECT id, name, desc FROM macros WHERE cuj_id = ?', [id])
    const edges = await dbAll('SELECT from_step_id as `from`, to_step_id as `to` FROM edges WHERE cuj_id = ?', [id])

    // Enrich steps with macros and their pages
    for (const step of steps) {
      // parse persisted data JSON if present
      if (step.data) {
        try {
          step.data = JSON.parse(step.data)
        } catch (e) {
          console.warn('Failed to parse step data JSON', e)
        }
      }

      const stepMacros = await dbAll(`
        SELECT m.id, m.name, m.desc FROM macros m
        JOIN step_macros sm ON m.id = sm.macro_id
        WHERE sm.step_id = ?
      `, [step.id])
      
      // Load pages for each macro
      for (const macro of stepMacros) {
        const pages = await dbAll(`
          SELECT id, url, page_name as name FROM macro_pages
          WHERE step_id = ? AND macro_id = ?
        `, [step.id, macro.id])
        macro.pages = pages
      }
      
      step.macros = stepMacros
    }

    return {
      ...cuj,
      steps,
      macros,
      edges
    }
  } catch (err) {
    console.error('Error fetching CUJ by ID:', err)
    return null
  }
}

export async function createCuj(payload) {
  try {
    const id = payload.id || `cuj-${Date.now()}`
    await dbRun(
      'INSERT INTO cujs (id, name, criticity, start_step_id) VALUES (?, ?, ?, ?)',
      [id, payload.name || 'New CUJ', payload.criticity || 'bronze', payload.start_step_id || null]
    )
    return { id, ...payload }
  } catch (err) {
    console.error('Error creating CUJ:', err)
    throw err
  }
}

export async function updateCuj(id, payload) {
  try {
    const updates = []
    const params = []
    if (payload.name !== undefined) {
      updates.push('name = ?')
      params.push(payload.name)
    }
    if (payload.criticity !== undefined) {
      updates.push('criticity = ?')
      params.push(payload.criticity)
    }
    if (payload.start_step_id !== undefined) {
      updates.push('start_step_id = ?')
      params.push(payload.start_step_id)
    }
    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)

    await dbRun(
      `UPDATE cujs SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
    return getCujById(id)
  } catch (err) {
    console.error('Error updating CUJ:', err)
    throw err
  }
}

// ============================================
// STEP OPERATIONS
// ============================================

export async function createStep(cujId, stepData) {
  try {
    const id = stepData.id || `step-${Date.now()}`
    const x = stepData.position?.x || 0
    const y = stepData.position?.y || 0
    const dataJson = stepData.data ? JSON.stringify(stepData.data) : null
    await dbRun(
      'INSERT INTO steps (id, cuj_id, name, position_x, position_y, data) VALUES (?, ?, ?, ?, ?, ?)',
      [id, cujId, stepData.name || 'New Step', x, y, dataJson]
    )
    return { id, cuj_id: cujId, name: stepData.name || 'New Step', position: { x, y }, data: stepData.data || {}, macros: [] }
  } catch (err) {
    console.error('Error creating step:', err)
    throw err
  }
}

export async function updateStep(cujId, stepId, payload) {
  try {
    const updates = []
    const params = []
    if (payload.name !== undefined) {
      updates.push('name = ?')
      params.push(payload.name)
    }
    if (payload.position?.x !== undefined) {
      updates.push('position_x = ?')
      params.push(payload.position.x)
    }
    if (payload.position?.y !== undefined) {
      updates.push('position_y = ?')
      params.push(payload.position.y)
    }
    if (payload.data !== undefined) {
      updates.push('data = ?')
      params.push(JSON.stringify(payload.data))
    }
    // always update timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP')

    // execute with params + identifiers
    await dbRun(
      `UPDATE steps SET ${updates.join(', ')} WHERE id = ? AND cuj_id = ?`,
      [...params, stepId, cujId]
    )
    const step = await dbGet('SELECT * FROM steps WHERE id = ? AND cuj_id = ?', [stepId, cujId])
    // parse JSON data field
    if (step && step.data) {
      try {
        step.data = JSON.parse(step.data)
      } catch {}
    }
    return step
  } catch (err) {
    console.error('Error updating step:', err)
    throw err
  }
}

export async function deleteStep(cujId, stepId) {
  try {
    await dbRun('DELETE FROM steps WHERE id = ? AND cuj_id = ?', [stepId, cujId])
  } catch (err) {
    console.error('Error deleting step:', err)
    throw err
  }
}

// ============================================
// MACRO OPERATIONS
// ============================================

export async function createMacro(cujId, macroData) {
  try {
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO macros (cuj_id, name, desc) VALUES (?, ?, ?)',
        [cujId, macroData.name, macroData.desc || ''],
        function(err) {
          if (err) reject(err)
          else resolve({ id: this.lastID, cuj_id: cujId, ...macroData })
        }
      )
    })
    return result
  } catch (err) {
    console.error('Error creating macro:', err)
    throw err
  }
}

export async function updateMacro(cujId, macroName, payload) {
  try {
    const macro = await dbGet(
      'SELECT id FROM macros WHERE cuj_id = ? AND name = ?',
      [cujId, macroName]
    )
    if (!macro) throw new Error('Macro not found')

    const updates = []
    const params = []
    if (payload.newName !== undefined) {
      updates.push('name = ?')
      params.push(payload.newName)
    }
    if (payload.desc !== undefined) {
      updates.push('desc = ?')
      params.push(payload.desc)
    }
    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(macro.id)

    await dbRun(
      `UPDATE macros SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
  } catch (err) {
    console.error('Error updating macro:', err)
    throw err
  }
}

// Update macro using its internal id (avoids name encoding issues)
export async function updateMacroById(cujId, macroId, payload) {
  try {
    // ensure macro belongs to cuj
    const macro = await dbGet(
      'SELECT id FROM macros WHERE id = ? AND cuj_id = ?',
      [macroId, cujId]
    )
    if (!macro) throw new Error('Macro not found')

    const updates = []
    const params = []
    if (payload.newName !== undefined) {
      updates.push('name = ?')
      params.push(payload.newName)
    }
    if (payload.desc !== undefined) {
      updates.push('desc = ?')
      params.push(payload.desc)
    }

    if (updates.length === 0) return
    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(macroId)

    await dbRun(
      `UPDATE macros SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
  } catch (err) {
    console.error('Error updating macro by id:', err)
    throw err
  }
}

// ============================================
// LINK MACRO TO STEP
// ============================================

export async function linkMacroToStep(cujId, stepId, macroData) {
  try {
    // Get or create macro
    let macro = await dbGet(
      'SELECT id FROM macros WHERE cuj_id = ? AND name = ?',
      [cujId, macroData.name]
    )
    if (!macro) {
      const result = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO macros (cuj_id, name, desc) VALUES (?, ?, ?)',
          [cujId, macroData.name, macroData.desc || ''],
          function(err) {
            if (err) reject(err)
            else resolve({ id: this.lastID })
          }
        )
      })
      macro = result
    }

    // Link macro to step
    await dbRun(
      'INSERT OR IGNORE INTO step_macros (step_id, macro_id) VALUES (?, ?)',
      [stepId, macro.id]
    )

    return macro
  } catch (err) {
    console.error('Error linking macro to step:', err)
    throw err
  }
}

export async function unlinkMacroFromStep(cujId, stepId, macroName) {
  try {
    const macro = await dbGet(
      'SELECT id FROM macros WHERE cuj_id = ? AND name = ?',
      [cujId, macroName]
    )
    if (macro) {
      await dbRun(
        'DELETE FROM step_macros WHERE step_id = ? AND macro_id = ?',
        [stepId, macro.id]
      )
    }
  } catch (err) {
    console.error('Error unlinking macro from step:', err)
    throw err
  }
}

// ============================================
// EDGE OPERATIONS
// ============================================

export async function createEdge(cujId, edgeData) {
  try {
    await dbRun(
      'INSERT OR IGNORE INTO edges (cuj_id, from_step_id, to_step_id) VALUES (?, ?, ?)',
      [cujId, edgeData.from, edgeData.to]
    )
    return edgeData
  } catch (err) {
    console.error('Error creating edge:', err)
    throw err
  }
}

export async function deleteEdge(cujId, edgeData) {
  try {
    await dbRun(
      'DELETE FROM edges WHERE cuj_id = ? AND from_step_id = ? AND to_step_id = ?',
      [cujId, edgeData.from, edgeData.to]
    )
  } catch (err) {
    console.error('Error deleting edge:', err)
    throw err
  }
}

// ============================================
// PAGE OPERATIONS (Dynatrace)
// ============================================

export async function linkPageToMacro(cujId, stepId, macroName, pageData) {
  try {
    const macro = await dbGet(
      'SELECT id FROM macros WHERE cuj_id = ? AND name = ?',
      [cujId, macroName]
    )
    if (!macro) throw new Error('Macro not found')

    // Accept both 'name' (from frontend) and 'page_name' formats
    const pageName = pageData.name || pageData.page_name || ''
    const pageUrl = pageData.url || ''

    console.log(`💾 Inserting page: name="${pageName}", url="${pageUrl}"`)

    await dbRun(
      'INSERT INTO macro_pages (step_id, macro_id, url, page_name) VALUES (?, ?, ?, ?)',
      [stepId, macro.id, pageUrl, pageName]
    )
    
    console.log(`✅ Page saved to DB for macro "${macroName}"`)
  } catch (err) {
    console.error('Error linking page to macro:', err)
    throw err
  }
}

export async function unlinkPageFromMacro(cujId, stepId, macroName, pageId) {
  try {
    const macro = await dbGet(
      'SELECT id FROM macros WHERE cuj_id = ? AND name = ?',
      [cujId, macroName]
    )
    if (macro) {
      await dbRun(
        'DELETE FROM macro_pages WHERE step_id = ? AND macro_id = ? AND (id = ? OR url = ?)',
        [stepId, macro.id, pageId, pageId]
      )
    }
  } catch (err) {
    console.error('Error unlinking page from macro:', err)
    throw err
  }
}

// Delete a macro defined at the CUJ level (also cascades to any step associations)
export async function deleteCujMacro(cujId, macroName) {
  try {
    await dbRun('DELETE FROM macros WHERE cuj_id = ? AND name = ?', [cujId, macroName])
  } catch (err) {
    console.error('Error deleting CUJ macro:', err)
    throw err
  }
}

// Delete macro by its numeric id (preferred to avoid encoding issues)
export async function deleteCujMacroById(cujId, macroId) {
  try {
    await dbRun('DELETE FROM macros WHERE cuj_id = ? AND id = ?', [cujId, macroId])
  } catch (err) {
    console.error('Error deleting CUJ macro by id:', err)
    throw err
  }
}

export default db
