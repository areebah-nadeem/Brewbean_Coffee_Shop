// config.js
dotenv = require('dotenv');
dotenv.config();
module.exports = {
  user: process.env.DB_USERNAME || 'COMP214_f23_ers_19',
  password: 'password',
  connectString: '199.212.26.208:1521/SQLD',
};