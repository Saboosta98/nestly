import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PORT = Number(process.env.PORT ?? 4318);
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(__dirname, '..', 'data'));
export const DB_PATH = path.join(DATA_DIR, 'nestly.sqlite');
export const NESTLY_PASSWORD = process.env.NESTLY_PASSWORD?.trim() || null;
export const STATIC_DIR = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.resolve(__dirname, '..', '..', 'dist', 'household-budget', 'browser');
export const HOST = process.env.HOST ?? '0.0.0.0';
