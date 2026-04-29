import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI belum diisi");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// cache global biar tidak reconnect terus di serverless
let cached: MongooseCache = (global as any)._mongoose;

if (!cached) {
  cached = (global as any)._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "elearning_customer_ai",
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}