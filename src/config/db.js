import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Check if replica set is configured (required for transactions)
    const admin = conn.connection.db.admin();
    const serverStatus = await admin.serverStatus();

    if (serverStatus.repl && serverStatus.repl.setName) {
      console.log(`🔄 Replica Set: ${serverStatus.repl.setName}`);
    } else {
      console.warn(
        "⚠️  Warning: MongoDB is not running as a replica set. Transactions will not work."
      );
      console.warn(
        "   Use docker-compose up to start a replica set for development."
      );
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
