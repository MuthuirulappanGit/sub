import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './db/connection.js';
import { seedDatabase } from './db/seed.js';
import { User } from './db/schema.js';

async function bootstrap() {
  try {
    console.log('⚡ Starting WattWise Backend Server...');
    await connectDB();

    // Auto-seed if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Empty MongoDB database detected. Auto-seeding initial production dataset...');
      await seedDatabase();
    }

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 WattWise IoT Server running on http://localhost:${env.PORT}`);
      console.log(`=======================================================`);
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('\n🛑 Shutting down WattWise Server gracefully...');
      server.close(() => {
        console.log('👋 HTTP Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

bootstrap();
