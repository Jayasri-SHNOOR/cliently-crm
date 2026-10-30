const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGODB_URI (or MONGO_URI) is missing in backend/.env");
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
console.log(`MongoDB connected: ${mongoose.connection.name}`)
}

module.exports = connectDB;