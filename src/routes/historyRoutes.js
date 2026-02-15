const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../helpers/authService');
const {
  GetHistory,
  GetHistoryItem,
  DeleteHistoryItem,
  ClearHistory
} = require('../controllers/history/history.controller');

router.get('/history', authMiddleware, GetHistory);
router.get('/history/:id', authMiddleware, GetHistoryItem);
router.delete('/history/:id', authMiddleware, DeleteHistoryItem);
router.delete('/history', authMiddleware, ClearHistory);

module.exports = router;
