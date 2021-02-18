'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Comment = require('../models/comment');

router.post(
  '/:scheduleId/users/:userId/comments',
  authenticationEnsurer,
  (req, res, next) => {
    const comment = req.body.comment.slice(0, 255);

    Comment.upsert({
      scheduleId: req.params.scheduleId,
      userId: req.params.userId,
      comment
    }).then(() => {
      res.json({ status: 'OK', comment });
    });
  }
);

module.exports = router;