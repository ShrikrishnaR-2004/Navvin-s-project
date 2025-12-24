import mongoose from 'mongoose';

/**
 * Execute a function within a MongoDB transaction
 * Automatically handles commit/abort and session cleanup
 * 
 * @param {Function} callback - Async function to execute within transaction
 * @returns {Promise} Result of the callback function
 */
export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Helper to check if MongoDB is configured for transactions
 */
export const isTransactionSupported = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    return !!(serverStatus.repl && serverStatus.repl.setName);
  } catch (error) {
    return false;
  }
};
