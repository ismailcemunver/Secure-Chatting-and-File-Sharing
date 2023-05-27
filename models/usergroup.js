const { DataTypes } = require("sequelize");
const db = require("../util/database");

const UserGroup = db.define("usergroup", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user: {
    type: DataTypes.INTEGER,
  },
  groupid: {
    type: DataTypes.INTEGER,
  },
});
module.exports = UserGroup;
