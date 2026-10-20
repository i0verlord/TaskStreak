const mongoose = require('mongoose');

let isConnected = false;

async function connectMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    console.warn('⚠️ [MongoDB] MONGODB_URI is not set in streak-api/.env.');
    console.warn('ℹ️ [MongoDB] Operating in high-fidelity in-memory mode. When ready, paste your MongoDB Atlas connection string in streak-api/.env!');
    isConnected = false;
    return false;
  }

  try {
    console.log('🔄 [MongoDB] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      dbName: 'taskstreak',
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ [MongoDB] Successfully connected to MongoDB Atlas (db: taskstreak)!');
    return true;
  } catch (err) {
    console.warn('⚠️ [MongoDB] Could not connect to MongoDB Atlas:', err.message);
    console.warn('ℹ️ [MongoDB] Operating in high-fidelity in-memory fallback mode.');
    isConnected = false;
    return false;
  }
}

function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectMongo,
  isMongoConnected,
};
