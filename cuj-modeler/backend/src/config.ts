import path from 'node:path';
import dotenv from 'dotenv';

const rootEnvPath = path.resolve(process.cwd(), '../../.env');

dotenv.config({ path: rootEnvPath });
