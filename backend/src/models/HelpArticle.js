const mongoose = require('mongoose')
const CATEGORIES = ['Getting Started', 'Leads', 'Deals', 'Analytics', 'Settings', 'Billing', 'Troubleshooting']
const helpArticleSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and hyphens']
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    summary: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, enum: CATEGORIES, required: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    quickGuide: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'help_articles' }
)

helpArticleSchema.index(
  { title: 'text', summary: 'text', tags: 'text', content: 'text' },
  { weights: { title: 10, tags: 5, summary: 3, content: 1 }, name: 'help_text_search' }
)

module.exports = mongoose.model('HelpArticle', helpArticleSchema)
module.exports.CATEGORIES = CATEGORIES