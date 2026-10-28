const express = require('express')
const { listArticles, getArticle, listGuides, getStatus } = require('../controllers/helpController')
const router = express.Router()

router.get('/articles', listArticles)
router.get('/articles/:slug', getArticle)
router.get('/guides', listGuides)
router.get('/status', getStatus)

module.exports = router