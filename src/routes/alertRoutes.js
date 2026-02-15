const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../helpers/authService');
const {
  CreateAlert,
  GetAlerts,
  GetAlert,
  UpdateAlert,
  DeleteAlert,
  RunAlertCheck,
  GetNotifications,
  RegisterPushToken
} = require('../controllers/alerts/alerts.controller');

router.post('/alerts', authMiddleware, CreateAlert);
router.get('/alerts', authMiddleware, GetAlerts);
router.get('/alerts/notifications', authMiddleware, GetNotifications);
router.post('/alerts/device-token', authMiddleware, RegisterPushToken);
router.post('/alerts/run-check', authMiddleware, RunAlertCheck);
router.get('/alerts/:id', authMiddleware, GetAlert);
router.patch('/alerts/:id', authMiddleware, UpdateAlert);
router.delete('/alerts/:id', authMiddleware, DeleteAlert);

module.exports = router;
