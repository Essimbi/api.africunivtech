const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('active', 'converted'), defaultValue: 'active' }
}, {
  tableName: 'carts'
});

module.exports = Cart;
