'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/schedule_arranger',
  // 以下の部分を追加してSSLを有効化
  {
    dialectOptions: {
      ssl: true,
    }
  }
);


module.exports = {
  database: sequelize,
  Sequelize
}