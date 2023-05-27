const { Sequelize } = require("sequelize");
const db = new Sequelize({
  host: "localhost",
  username: "root",
  password: "cse492",
  database: "scafs",
  dialect: "mysql",
});

module.exports = db;
