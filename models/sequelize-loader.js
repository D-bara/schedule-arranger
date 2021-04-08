'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/schedule_arranger',
  {
    // logging: false //テストのとき邪魔なSQL文を消す
  });

module.exports = {
  database: sequelize,
  Sequelize
}