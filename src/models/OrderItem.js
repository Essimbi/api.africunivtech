const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  orderId: { type: DataTypes.UUID, allowNull: false },
  productId: { type: DataTypes.UUID, allowNull: false },
  variantId: { type: DataTypes.UUID, allowNull: true },
  productName: { type: DataTypes.STRING, allowNull: false },
  variantName: { type: DataTypes.STRING },
  sku: { type: DataTypes.STRING },
  unitPriceTtc: { type: DataTypes.FLOAT, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  lineTotalTtc: { type: DataTypes.FLOAT, allowNull: false }
}, {
  tableName: 'order_items'
});

module.exports = OrderItem;
