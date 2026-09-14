const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  categoryId: { type: DataTypes.UUID, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  brand: { type: DataTypes.STRING, allowNull: false },
  shortDescription: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  specs: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const raw = this.getDataValue('specs');
      try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
    },
    set(value) {
      this.setDataValue('specs', JSON.stringify(value || {}));
    }
  },
  highlights: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('highlights');
      try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
    },
    set(value) {
      this.setDataValue('highlights', JSON.stringify(value || []));
    }
  },
  priceHt: { type: DataTypes.FLOAT, allowNull: false },
  priceTtc: { type: DataTypes.FLOAT, allowNull: false },
  compareAtPriceTtc: { type: DataTypes.FLOAT },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stockAlertThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  warrantyMonths: { type: DataTypes.INTEGER, defaultValue: 24 },
  availability: {
    type: DataTypes.ENUM('in_stock', 'on_order', 'incoming'),
    defaultValue: 'in_stock'
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  isNew: { type: DataTypes.BOOLEAN, defaultValue: false },
  ratingAvg: { type: DataTypes.FLOAT, defaultValue: 0 },
  ratingCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'products'
});

module.exports = Product;
