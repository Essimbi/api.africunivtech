const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM(...ORDER_STATUSES), defaultValue: 'pending', allowNull: false },
  subtotalHt: { type: DataTypes.FLOAT, allowNull: false },
  vatAmount: { type: DataTypes.FLOAT, allowNull: false },
  vatRate: { type: DataTypes.FLOAT, allowNull: false },
  shippingFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  totalTtc: { type: DataTypes.FLOAT, allowNull: false },
  paymentMethod: {
    type: DataTypes.ENUM('orange_money', 'mtn_momo', 'card', 'bank_transfer'),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid_simulated'),
    defaultValue: 'paid_simulated'
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const raw = this.getDataValue('shippingAddress');
      try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
    },
    set(value) {
      this.setDataValue('shippingAddress', JSON.stringify(value || {}));
    }
  },
  billingAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const raw = this.getDataValue('billingAddress');
      try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
    },
    set(value) {
      this.setDataValue('billingAddress', JSON.stringify(value || {}));
    }
  },
  notes: { type: DataTypes.STRING }
}, {
  tableName: 'orders'
});

Order.STATUSES = ORDER_STATUSES;

module.exports = Order;
