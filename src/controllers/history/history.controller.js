const RateHistory = require('../../models/rateHistoryModel');

exports.GetHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, fromCurrency, toCurrency } = req.query;
    const filters = { userId: req.user._id };

    if (fromCurrency) filters.fromCurrency = fromCurrency.toUpperCase();
    if (toCurrency) filters.toCurrency = toCurrency.toUpperCase();

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      RateHistory.find(filters)
        .sort({ checkedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      RateHistory.countDocuments(filters)
    ]);

    res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      items
    });
  } catch (err) {
    console.error('GetHistory error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
};

exports.GetHistoryItem = async (req, res) => {
  try {
    const item = await RateHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).lean();

    if (!item) {
      return res.status(404).json({ success: false, error: 'History item not found' });
    }

    res.json({ success: true, item });
  } catch (err) {
    console.error('GetHistoryItem error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch history item' });
  }
};

exports.DeleteHistoryItem = async (req, res) => {
  try {
    const result = await RateHistory.deleteOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'History item not found' });
    }

    res.json({ success: true, message: 'History item deleted' });
  } catch (err) {
    console.error('DeleteHistoryItem error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete history item' });
  }
};

exports.ClearHistory = async (req, res) => {
  try {
    await RateHistory.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'History cleared' });
  } catch (err) {
    console.error('ClearHistory error:', err);
    res.status(500).json({ success: false, error: 'Failed to clear history' });
  }
};
