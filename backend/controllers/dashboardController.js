const dashboardService = require('../services/dashboardService');

const VALID_RANGES = ['today', '7d', '30d', 'all'];

const getDashboard = async (req, res) => {
  try {
    const range = VALID_RANGES.includes(req.query.range) ? req.query.range : 'today';
    const data = await dashboardService.getDashboardData(range);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard };
