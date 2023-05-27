const { DataTypes } = require("sequelize");
const db = require("../util/database");

const Friend = db.define("friend", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sender: {
    type: DataTypes.INTEGER,
  },
  receiver: {
    type: DataTypes.INTEGER,
  },
});
module.exports = Friend;
