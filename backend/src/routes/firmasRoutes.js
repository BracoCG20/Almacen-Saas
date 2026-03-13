const { Router } = require('express');
const {
  getInfoFirma,
  procesarFirma,
} = require('../controllers/firmasController');

const router = Router();

router.get('/:token', getInfoFirma);
router.post('/:token', procesarFirma);

module.exports = router;
