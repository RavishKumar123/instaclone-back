const express = require('express');
const router = express.Router();

const {
  loginAuthentication,
  register,
  requireAuth,
  changePassword,
} = require('../controllers/Auth.Controller');

router.post('/login', loginAuthentication);
router.post('/register', register);
router.put('/password', requireAuth, changePassword);

module.exports = router;
