'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Comment = require('../models/comment');

router.post(
  '/:scheduleId/users/:userId/comments',
  authenticationEnsurer,
  (req, res, next) => {
    let comment = req.body.comment;
    // 禁止用語設定
    comment = comment.replace(/NGワード/g, "***")

    Comment.upsert({
      scheduleId: req.params.scheduleId,
      userId: req.params.userId,
      comment: comment.slice(0, 255)
    }).then(() => {
      res.json({ status: 'OK', comment });
    });
  }
);

module.exports = router;