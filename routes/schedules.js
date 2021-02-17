'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('uuid');
const Schedule = require('../models/schedule');
const Candidate = require('../models/candidate');
const User = require('../models/user');
const Availability = require('../models/availability');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, (req, res, next) => {
  const scheduleId = uuid.v4();
  const updatedAt = new Date();
  Schedule.create({
    scheduleId,
    scheduleName: req.body.scheduleName.slice(0, 255) || '（名称未設定）',
    memo: req.body.memo.slice(0, 1000),
    createdBy: req.user.id,
    updatedAt
  }).then((schedule) => {
    const candidates = req.body.candidates
      .trim() // 余分なスペースの削除
      .split('\n') // 候補の分割
      .map((s) => s.trim()) // 各候補の余分なスペースを削除
      .filter((s) => s !== "") // 空の候補は除外
      .map((candidateName) => {
        return {
          candidateName,
          scheduleId: schedule.scheduleId
        };
      });
    Candidate.bulkCreate(candidates).then(() => {
      res.redirect('/schedules/' + schedule.scheduleId);
    });
  });
});

router.get('/:scheduleId', authenticationEnsurer, (req, res, next) => {
  Schedule.findOne({
    include: [
      {
        model: User,
        attributes: ['userId', 'username']
      }],
    where: {
      scheduleId: req.params.scheduleId
    },
    order: [['updatedAt', 'DESC']]
  }).then((schedule) => {
    if (schedule) {
      Candidate.findAll({
        where: { scheduleId: schedule.scheduleId },
        order: ['"candidateId"']
      }).then((candidates) => {
        // データベースからその予定の全ての出欠を取得する
        Availability.findAll({
          include: [
            {
              model: User,
              attributes: ['userId', 'username']
            }
          ],
          where: { scheduleId: schedule.scheduleId },
          order: [[User, 'username', 'ASC'], ['candidateId', 'ASC']]
        }).then((availabilities) => {
          // 出欠 MapMap(キー:ユーザー ID, 値:出欠Map(キー:候補 ID, 値:出欠)) を作成する
          const availabilityMapMap = new Map(); // key: userId, value: Map(key: candidateId, availability)
          availabilities.forEach((a) => {
            const map = availabilityMapMap.get(a.user.userId) || new Map();
            map.set(a.candidateId, a.availability);
            availabilityMapMap.set(a.user.userId, map);
          });

          // 閲覧ユーザーと出欠に紐づくユーザーからユーザー Map (キー:ユーザー ID, 値:ユーザー) を作る
          const userMap = new Map(); // key: userId, value: User
          userMap.set(parseInt(req.user.id), {
            isSelf: true,
            userId: parseInt(req.user.id),
            username: req.user.username
          });
          availabilities.forEach((a) => {
            userMap.set(a.user.userId, {
              isSelf: parseInt(req.user.id) === a.user.userId, // 閲覧ユーザー自身であるかを確かめる
              userId: a.user.userId,
              username: a.user.username
            });
          });

          // 全ユーザー、全候補で二重ループしてそれぞれの出欠の値がない場合には、「欠席」を設定する
          const users = Array.from(userMap).map((keyValue) => keyValue[1]);
          users.forEach((u) => {
            candidates.forEach((c) => {
              const map = availabilityMapMap.get(u.userId) || new Map();
              const a = map.get(c.candidateId) || 0; // デフォルト値は 0 を利用
              map.set(c.candidateId, a);
              availabilityMapMap.set(u.userId, map);
            });
          });

          res.render('schedule', {
            user: req.user,
            schedule,
            candidates,
            users,
            availabilityMapMap,
          });
        });
      });
    } else {
      const err = new Error('指定された予定は見つかりません');
      err.status = 404;
      next(err);
    }
  });
});

module.exports = router;