import { Router } from 'express';
import { getDynatracePages } from '../services/dynatraceService.js';

export const dynatraceRouter = Router();

dynatraceRouter.get('/pages', async (_req, res) => {
  const pages = await getDynatracePages();
  res.json(pages);
});
