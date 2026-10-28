<<<<<<< HEAD
const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in backend/.env");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB Atlas connected");
}

module.exports = connectDB;
=======
const mongoose = require('mongoose')
async function connectDB() {
  const uri = process.env.MONGO_URI
  if(!uri){
    throw new Error('MONGO_URI is missing.')
  }
  await mongoose.connect(uri)
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}
module.exports = connectDB
>>>>>>> dev
