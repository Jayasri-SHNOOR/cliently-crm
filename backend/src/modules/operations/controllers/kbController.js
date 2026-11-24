const KbArticle = require('../../../models/KbArticle')
const AppError = require('../../../utils/AppError')
const pick = require('../../../utils/pick')
const {KB_VISIBILITIES, KB_STATUSES} = require('../../../models/KbArticle')
const {assertValidId, parsePagination, sendPage, enumFilter} = require('../helpers')

const EDITABLE = ['title', 'summary', 'content', 'visibility']

function cleanTags(value){
  if(value === undefined){
    return undefined
  }
  if(!Array.isArray(value)){
    throw new AppError('tags must be a list', 400)
  }
  const tags = value
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag !== '')
  return [...new Set(tags)]
}

function cleanCategory(value){
  if(value === undefined){
    return undefined
  }
  if(typeof value !== 'string'){
    throw new AppError('category must be text', 400)
  }
  return value.trim() || 'General'
}

function applyFields(article, body){
  article.set(pick(body, EDITABLE))
  const category = cleanCategory(body.category)
  if(category !== undefined){
    article.category = category
  }
  const tags = cleanTags(body.tags)
  if(tags !== undefined){
    article.tags = tags
  }
}

function applyStatus(article, status){
  if(status === undefined || status === article.status){
    return
  }
  article.status = status
  if(status === 'Published' && !article.publishedAt){
    article.publishedAt = new Date()
  }
}

async function findArticle(req){
  assertValidId(req.params.id, 'article')
  const article = await KbArticle.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
  if(!article){
    throw new AppError('Article not found', 404)
  }
  return article
}

async function listArticles(req, res, next){
  try{
    const filter = {tenantId: req.user.tenantId}
    enumFilter(filter, 'status', req.query.status, KB_STATUSES)
    enumFilter(filter, 'visibility', req.query.visibility, KB_VISIBILITIES)

    if(typeof req.query.category === 'string' && req.query.category.trim() !== ''){
      filter.category = req.query.category.trim()
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if(q.length > 100){
      throw new AppError('Search must be 100 characters or less', 400)
    }

    const paging = parsePagination(req.query)
    let query
    if(q){
      filter.$text = {$search: q}
      query = KbArticle.find(filter, {content: 0, score: {$meta: 'textScore'}})
        .sort({score: {$meta: 'textScore'}, updatedAt: -1})
    }else{
      query = KbArticle.find(filter).select('-content').sort({updatedAt: -1})
    }

    const [rows, total] = await Promise.all([
      query.skip(paging.skip).limit(paging.limit).lean(),
      KbArticle.countDocuments(filter)
    ])

    const articles = rows.map(({score, ...article}) => article)
    sendPage(res, articles, total, paging)
  }catch(err){
    next(err)
  }
}

async function listCategories(req, res, next){
  try{
    const categories = await KbArticle.distinct('category', {tenantId: req.user.tenantId})
    const sorted = categories
      .filter((category) => typeof category === 'string' && category.trim() !== '')
      .sort((a, b) => a.localeCompare(b))
    res.json({data: sorted})
  }catch(err){
    next(err)
  }
}

async function getArticle(req, res, next){
  try{
    assertValidId(req.params.id, 'article')
    const scope = {_id: req.params.id, tenantId: req.user.tenantId}
    let article = await KbArticle.findOneAndUpdate(
      {...scope, status: 'Published'},
      {$inc: {views: 1}},
      {returnDocument: 'after'}
    )
    if(!article){
      article = await KbArticle.findOne(scope)
    }
    if(!article){
      throw new AppError('Article not found', 404)
    }

    res.json({data: article})
  }catch(err){
    next(err)
  }
}

async function createArticle(req, res, next){
  try{
    const article = new KbArticle({
      tenantId: req.user.tenantId,
      authorId: req.user.id,
      authorName: req.user.name
    })
    applyFields(article, req.body)
    applyStatus(article, req.body.status)
    await article.save()

    res.status(201).json({data: article})
  }catch(err){
    next(err)
  }
}

async function updateArticle(req, res, next){
  try{
    const article = await findArticle(req)
    const keys = [...EDITABLE, 'category', 'tags', 'status']
    if(!keys.some((key) => req.body[key] !== undefined)){
      throw new AppError('Provide at least one field to update', 400)
    }

    applyFields(article, req.body)
    applyStatus(article, req.body.status)
    await article.save()

    res.json({data: article})
  }catch(err){
    next(err)
  }
}

async function deleteArticle(req, res, next){
  try{
    assertValidId(req.params.id, 'article')
    const article = await KbArticle.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if(!article){
      throw new AppError('Article not found', 404)
    }
    res.json({message: 'Article deleted'})
  }catch(err){
    next(err)
  }
}

module.exports = {
  listArticles,
  listCategories,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
}