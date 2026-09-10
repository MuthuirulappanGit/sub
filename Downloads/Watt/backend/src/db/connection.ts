import mongoose from 'mongoose';
import { env } from '../config/env.js';

let mongod: any = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  try {
    // Attempt connecting to configured MONGODB_URI (2s timeout)
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`⚡ Connected to MongoDB at: ${env.MONGODB_URI}`);
  } catch (err) {
    console.warn('⚠️ Could not connect to external MongoDB server. Starting MongoMemoryServer in-memory fallback...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'wattwise',
        },
        binary: {
          version: '7.0.12',
        },
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`⚡ Connected to MongoMemoryServer at: ${uri}`);
    } catch (memErr) {
      console.error('❌ Failed to start MongoMemoryServer:', memErr);
      throw memErr;
    }
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
}
