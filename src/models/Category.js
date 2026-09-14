const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  icon: { type: DataTypes.STRING },
  position: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'categories'
});

module.exports = Category;
