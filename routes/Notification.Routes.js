const express = require('express');
const notificationRouter = express.Router();

const {
  retrieveNotifications,
  readNotifications,
} = require('../controllers/Notification.Controller');
const { requireAuth } = require('../controllers/Auth.Controller');

notificationRouter.get('/', requireAuth, retrieveNotifications);

notificationRouter.put('/', requireAuth, readNotifications);

module.exports = notificationRouter;
