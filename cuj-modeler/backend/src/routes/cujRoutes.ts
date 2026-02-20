import { Router } from 'express';
import { createCuj, deleteCuj, getCujById, listCuj, updateCuj } from '../services/cujService.js';

export const cujRouter = Router();

cujRouter.get('/', async (_req, res) => {
  const cujs = await listCuj();
  res.json(cujs);
});

cujRouter.post('/', async (req, res) => {
  const cuj = await createCuj(req.body);
  res.status(201).json(cuj);
});

cujRouter.get('/:id', async (req, res) => {
  const cuj = await getCujById(req.params.id);
  if (!cuj) {
    res.status(404).json({ message: 'CUJ introuvable' });
    return;
  }
  res.json(cuj);
});

cujRouter.put('/:id', async (req, res) => {
  const cuj = await updateCuj(req.params.id, req.body);
  if (!cuj) {
    res.status(404).json({ message: 'CUJ introuvable' });
    return;
  }
  res.json(cuj);
});

cujRouter.delete('/:id', async (req, res) => {
  const deleted = await deleteCuj(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: 'CUJ introuvable' });
    return;
  }
  res.status(204).send();
});
