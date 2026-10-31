import mongoose from 'mongoose';
import dns from 'dns';
import { MongoMemoryReplSet, MongoMemoryServer } from 'mongodb-memory-server';

let memoryReplSet = null;

export const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    let mongoUri = uri;

    if (!mongoUri) {
      console.log('No MONGODB_URI provided. Starting in-memory MongoDB Replica Set for transaction support...');
      try {
        memoryReplSet = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: 'wiredTiger' }
        });
        mongoUri = memoryReplSet.getUri();
        console.log(`In-memory MongoDB Replica Set started at ${mongoUri}`);
      } catch (replError) {
        console.warn('Failed to start MongoMemoryReplSet, falling back to standalone MongoMemoryServer:', replError.message);
        const memServer = await MongoMemoryServer.create();
        mongoUri = memServer.getUri();
      }
    } else if (mongoUri.startsWith('mongodb+srv://')) {
      // Ensure reliable DNS SRV resolution across environments
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        console.warn('DNS server override notice:', dnsErr.message);
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryReplSet) {
      await memoryReplSet.stop();
    }
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};
