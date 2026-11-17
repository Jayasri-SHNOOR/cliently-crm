const express = require('express')
const {
  listArticles,
  listCategories,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/kbController')
const router = express.Router()

router.get('/', listArticles)
router.post('/', createArticle)
router.get('/categories', listCategories)
router.get('/:id', getArticle)
router.patch('/:id', updateArticle)
router.delete('/:id', deleteArticle)

module.exports = router