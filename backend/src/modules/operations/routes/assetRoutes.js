const express = require('express')
const {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  assignAsset,
  unassignAsset,
  adjustStock,
  deleteAsset
} = require('../controllers/assetController')
const router = express.Router()

router.get('/', listAssets)
router.post('/', createAsset)
router.get('/:id', getAsset)
router.patch('/:id', updateAsset)
router.delete('/:id', deleteAsset)
router.post('/:id/assign', assignAsset)
router.post('/:id/unassign', unassignAsset)
router.post('/:id/adjust-stock', adjustStock)

module.exports = router