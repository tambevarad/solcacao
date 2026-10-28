import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/**
 * Open the shared mongoose connection used by every feature's models. Rejects (does not retry
 * forever) when the server cannot be reached, so startup fails with a clear message.
 */
export async function connectDb(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/** True only while the connection is open; health and routes report 503 otherwise. */
export const isDatabaseReady = () => mongoose.connection.readyState === 1;
