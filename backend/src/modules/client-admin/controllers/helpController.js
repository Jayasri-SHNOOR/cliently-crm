const mongoose = require('mongoose')
const HelpArticle = require('../../../models/HelpArticle')
const AppError = require('../../../utils/AppError')
const SEARCH_MIN_LENGTH = 2
const SEARCH_MAX_LENGTH = 100
const DB_SLOW_MS = 1000
const DB_TIMEOUT_MS = 3000

function formatArticleCard(article) {
  return{
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    category: article.category
  }
}
function formatArticle(article) {
  return{
    ...formatArticleCard(article),
    content: article.content,
    tags: article.tags,
    updatedAt: article.updatedAt
  }
}

async function listArticles(req, res, next) {
  try{
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const category = typeof req.query.category === 'string' ? req.query.category : ''
    const filter = { published: true }
    if (category) filter.category = category
    if (!search) {
      const articles = await HelpArticle.find(filter).sort({ category: 1, order: 1 }).lean()
      return res.json({ count: articles.length, articles: articles.map(formatArticleCard) })
    }
    if (search.length < SEARCH_MIN_LENGTH) {
      throw new AppError(`Search text must be at least ${SEARCH_MIN_LENGTH} characters`, 400)
    }
    if (search.length > SEARCH_MAX_LENGTH) {
      throw new AppError(`Search text must be ${SEARCH_MAX_LENGTH} characters or less`, 400)
    }
    filter.$text = { $search: search }
    const articles = await HelpArticle.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean()

    res.json({ count: articles.length, articles: articles.map(formatArticleCard) })
  }catch(err){
    next(err)
  }
}

async function getArticle(req, res, next) {
  try {
    const article = await HelpArticle.findOne({
      slug: req.params.slug.toLowerCase(),
      published: true
    }).lean()

    if (!article) {
      throw new AppError('Article not found', 404)
    }

    res.json(formatArticle(article))
  } catch (err) {
    next(err)
  }
}

async function listGuides(req, res, next) {
  try {
    const guides = await HelpArticle.find({ published: true, quickGuide: true })
      .sort({ order: 1 })
      .limit(4)
      .lean()

    res.json({ guides: guides.map(formatArticleCard) })
  } catch (err) {
    next(err)
  }
}

function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Timed out')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

async function checkDatabase() {
  const started = Date.now()

  try {
    await withTimeout(mongoose.connection.db.command({ ping: 1 }), DB_TIMEOUT_MS)
    const responseTimeMs = Date.now() - started
    return {
      status: responseTimeMs > DB_SLOW_MS ? 'Degraded' : 'Operational',
      responseTimeMs
    }
  } catch (err) {
    return { status: 'Down', responseTimeMs: null }
  }
}

async function getStatus(req, res, next) {
  try {
    const database = await checkDatabase()

    const services = [
      { name: 'Cliently CRM', status: 'Operational' },
      { name: 'API Services', status: 'Operational', uptimeSeconds: Math.round(process.uptime()) },
      { name: 'Database', status: database.status, responseTimeMs: database.responseTimeMs },
      { name: 'Notifications', status: 'Operatinoal' }
    ]

    const statuses = services.map((service) => service.status)
    let overall = 'All Systems Operational'
    if (statuses.includes('Degraded')) overall = 'Degraded Performance'
    if (statuses.includes('Down')) overall = 'Major Outage'

    res.json({
      overall,
      checkedAt: new Date().toISOString(),
      services
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { listArticles, getArticle, listGuides, getStatus }