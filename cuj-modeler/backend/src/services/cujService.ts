import { randomUUID } from 'node:crypto';
import { getDb } from '../db/database.js';
import { CUJ } from '../types/cuj.js';

const parseRow = (row: { payload: string }): CUJ => JSON.parse(row.payload) as CUJ;

export const listCuj = async (): Promise<CUJ[]> => {
  const db = await getDb();
  const rows = await db.all<{ payload: string }[]>('SELECT payload FROM cuj ORDER BY createdAt DESC');
  return rows.map(parseRow);
};

export const getCujById = async (id: string): Promise<CUJ | null> => {
  const db = await getDb();
  const row = await db.get<{ payload: string }>('SELECT payload FROM cuj WHERE id = ?', id);
  return row ? parseRow(row) : null;
};

export const createCuj = async (payload: Omit<CUJ, 'id'> & { id?: string }): Promise<CUJ> => {
  const db = await getDb();
  const cuj: CUJ = { ...payload, id: payload.id ?? randomUUID() };
  const now = new Date().toISOString();
  await db.run(
    'INSERT INTO cuj (id, name, criticity, payload, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    cuj.id,
    cuj.name,
    cuj.criticity,
    JSON.stringify(cuj),
    now,
    now
  );
  return cuj;
};

export const updateCuj = async (id: string, payload: Omit<CUJ, 'id'>): Promise<CUJ | null> => {
  const db = await getDb();
  const existing = await getCujById(id);
  if (!existing) {
    return null;
  }

  const cuj: CUJ = { ...payload, id };
  await db.run(
    'UPDATE cuj SET name = ?, criticity = ?, payload = ?, updatedAt = ? WHERE id = ?',
    cuj.name,
    cuj.criticity,
    JSON.stringify(cuj),
    new Date().toISOString(),
    id
  );

  return cuj;
};

export const deleteCuj = async (id: string): Promise<boolean> => {
  const db = await getDb();
  const result = await db.run('DELETE FROM cuj WHERE id = ?', id);
  return result.changes > 0;
};
