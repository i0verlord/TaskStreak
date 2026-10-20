require('dotenv').config();
const { connectMongo } = require('../db/mongo');
const { seedDefaultUserIfMongo } = require('../services/taskService');

async function initializeDatabase() {
  console.log('🔄 Connecting to MongoDB database...');
  try {
    await connectMongo();
    await seedDefaultUserIfMongo();
    console.log('🎉 MongoDB Atlas initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  }
}

initializeDatabase();
