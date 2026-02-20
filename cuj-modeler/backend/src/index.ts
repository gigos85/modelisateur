import './config.js';
import cors from 'cors';
import express from 'express';
import { cujRouter } from './routes/cujRoutes.js';
import { dynatraceRouter } from './routes/dynatraceRoutes.js';


const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.use('/api/cuj', cujRouter);
app.use('/api/dynatrace', dynatraceRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend started on http://localhost:${port}`);
});
