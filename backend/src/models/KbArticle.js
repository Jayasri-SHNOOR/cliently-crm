const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const KB_VISIBILITIES = ['Internal', 'Public']
const KB_STATUSES = ['Draft', 'Published']

const kbArticleSchema = new mongoose.Schema(
  {
    tenantId: {type: ObjectId, ref: 'Tenant', required: true},
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be 200 characters or less']
    },
    summary: {type: String, trim: true, maxlength: [300, 'Summary must be 300 characters or less']},
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [20000, 'Content must be 20000 characters or less']
    },
    category: {type: String, trim: true, maxlength: 60, default: 'General'},
    tags: {
      type: [{type: String, trim: true, lowercase: true, maxlength: 30}],
      validate: {
        validator: (tags) => tags.length <= 10,
        message: 'Use at most 10 tags'
      }
    },
    visibility: {type: String, enum: KB_VISIBILITIES, default: 'Internal'},
    status: {type: String, enum: KB_STATUSES, default: 'Draft'},
    authorId: {type: ObjectId, ref: 'User'},
    authorName: {type: String, trim: true, maxlength: 100},
    publishedAt: {type: Date, default: null},
    views: {type: Number, default: 0, min: 0}
  },
  {timestamps: true, collection: 'kb_articles'}
)

kbArticleSchema.index({tenantId: 1, status: 1, visibility: 1, updatedAt: -1})
kbArticleSchema.index({tenantId: 1, category: 1})
kbArticleSchema.index(
  {tenantId: 1, title: 'text', summary: 'text', content: 'text', tags: 'text'},
  {weights: {title: 10, tags: 5, summary: 3, content: 1}, name: 'kb_search'}
)

module.exports = mongoose.model('KbArticle', kbArticleSchema)
module.exports.KB_VISIBILITIES = KB_VISIBILITIES
module.exports.KB_STATUSES = KB_STATUSES