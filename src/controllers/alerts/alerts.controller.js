const Alert = require('../../models/alertModel');
const AlertNotification = require('../../models/alertNotificationModel');
const User = require('../../models/userModel');
const { runAlertsCheck } = require('../../services/alertsService');
const { validateCurrency } = require('../../helpers/currencyHelper');

exports.CreateAlert = async (req, res) => {
  try {
    const {
      fromCurrency,
      toCurrency,
      amount = 1,
      targetAmount,
      condition = 'gte',
      providerType
    } = req.body;

    if (!fromCurrency || !toCurrency || !targetAmount) {
      return res.status(400).json({
        success: false,
        error: 'fromCurrency, toCurrency, and targetAmount are required'
      });
    }

    const sourceCurrency = fromCurrency.toUpperCase();
    const targetCurrency = toCurrency.toUpperCase();

    if (!validateCurrency(sourceCurrency) || !validateCurrency(targetCurrency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency code'
      });
    }

    if (!['gte', 'lte'].includes(condition)) {
      return res.status(400).json({
        success: false,
        error: 'condition must be gte or lte'
      });
    }

    const alert = await Alert.create({
      userId: req.user._id,
      fromCurrency: sourceCurrency,
      toCurrency: targetCurrency,
      amount: parseFloat(amount),
      targetAmount: parseFloat(targetAmount),
      condition,
      providerType: providerType || null
    });

    res.status(201).json({ success: true, alert });
  } catch (err) {
    console.error('CreateAlert error:', err);
    res.status(500).json({ success: false, error: 'Failed to create alert' });
  }
};

exports.GetAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const filters = { userId: req.user._id };

    if (active !== undefined) {
      filters.active = active === 'true';
    }

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      Alert.find(filters)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Alert.countDocuments(filters)
    ]);

    res.json({ success: true, page: pageNum, limit: limitNum, total, items });
  } catch (err) {
    console.error('GetAlerts error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
};

exports.GetAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (err) {
    console.error('GetAlert error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch alert' });
  }
};

exports.UpdateAlert = async (req, res) => {
  try {
    const update = {};
    const allowed = ['amount', 'targetAmount', 'condition', 'providerType', 'active'];

    allowed.forEach(key => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });

    if (update.condition && !['gte', 'lte'].includes(update.condition)) {
      return res.status(400).json({ success: false, error: 'condition must be gte or lte' });
    }

    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (err) {
    console.error('UpdateAlert error:', err);
    res.status(500).json({ success: false, error: 'Failed to update alert' });
  }
};

exports.DeleteAlert = async (req, res) => {
  try {
    const result = await Alert.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    console.error('DeleteAlert error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete alert' });
  }
};

exports.RunAlertCheck = async (req, res) => {
  try {
    const results = await runAlertsCheck({ userId: req.user._id });
    res.json({ success: true, results });
  } catch (err) {
    console.error('RunAlertCheck error:', err);
    res.status(500).json({ success: false, error: 'Failed to run alert checks' });
  }
};

exports.GetNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      AlertNotification.find({ userId: req.user._id })
        .sort({ triggeredAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      AlertNotification.countDocuments({ userId: req.user._id })
    ]);

    res.json({ success: true, page: pageNum, limit: limitNum, total, items });
  } catch (err) {
    console.error('GetNotifications error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

exports.RegisterPushToken = async (req, res) => {
  try {
    const { token, platform } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'token is required' });
    }

    const user = await User.findById(req.user._id);
    const existing = user.pushTokens.find(t => t.token === token);

    if (!existing) {
      user.pushTokens.push({ token, platform });
      await user.save();
    }

    res.json({ success: true, message: 'Push token registered' });
  } catch (err) {
    console.error('RegisterPushToken error:', err);
    res.status(500).json({ success: false, error: 'Failed to register push token' });
  }
};
