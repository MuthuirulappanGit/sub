import { app } from '../backend/src/app.js';
import { connectDB } from '../backend/src/db/connection.js';
import type { Request, Response } from 'express';

let databaseConnection: Promise<void> | null = null;

export default async function handler(req: Request, res: Response) {
  databaseConnection ??= connectDB();
  await databaseConnection;
  return app(req, res);
}
