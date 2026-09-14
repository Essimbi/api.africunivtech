const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  orderId: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  comment: { type: DataTypes.STRING },
  changedByUserId: { type: DataTypes.UUID, allowNull: true }
}, {
  tableName: 'order_status_history'
});

module.exports = OrderStatusHistory;
