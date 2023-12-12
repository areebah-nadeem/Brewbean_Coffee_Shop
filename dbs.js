const oracledb = require('oracledb');
const dbconfig = require('./dbconfig');

async function connectToOracleDB() {
  try {
    const connection = await oracledb.getConnection(dbconfig);
    console.log('Connected to Oracle SQL database...');
    return connection;
  } catch (err) {
    console.error('Error connecting to Oracle SQL database:', err);
    throw err; // Re-throw the error to handle it where this function is called
  }
}

module.exports = { connectToOracleDB };
