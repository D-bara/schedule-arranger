'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/schedule_arranger',
  {
    logging: false
  });

module.exports = {
  database: sequelize,
  Sequelize
}