const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  orderId: { type: DataTypes.UUID, allowNull: false, unique: true },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  totalTtc: { type: DataTypes.FLOAT, allowNull: false },
  issuedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'invoices'
});

module.exports = Invoice;
