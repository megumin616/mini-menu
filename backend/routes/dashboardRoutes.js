const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.use(verifyToken);
router.get('/', checkRole(['ADMIN']), ctrl.getDashboard);

module.exports = router;
