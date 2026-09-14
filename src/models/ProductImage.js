const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  productId: { type: DataTypes.UUID, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  altText: { type: DataTypes.STRING },
  position: { type: DataTypes.INTEGER, defaultValue: 0 },
  isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'product_images'
});

module.exports = ProductImage;
