const { DataTypes } = require("sequelize");
const db = require("../util/database");

const Group = db.define("group", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});
module.exports = Group;
