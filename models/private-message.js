const { DataTypes } = require('sequelize');
const db = require('../util/database');

const PrivateMessage = db.define('privateMessage', {
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
  messageContent: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = PrivateMessage;