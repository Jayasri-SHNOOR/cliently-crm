require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const HelpArticle = require('../models/HelpArticle')
const articles = require('./helpArticles')

async function seedHelp() {
  await connectDB()
  await HelpArticle.init()
  const result = await HelpArticle.bulkWrite(
    articles.map((article) => ({
      updateOne: {
        filter: { slug: article.slug },
        update: { $set: article },
        upsert: true
      }
    }))
  )
  console.log(`Help articles: ${result.upsertedCount} added, ${result.modifiedCount} updated`)
}

seedHelp()
  .catch((err) => {
    console.error('Help seed failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())