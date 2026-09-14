const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  label: { type: DataTypes.STRING, defaultValue: 'Principale' },
  fullName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  line1: { type: DataTypes.STRING, allowNull: false },
  line2: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING, allowNull: false },
  region: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING, defaultValue: 'Cameroun' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'addresses'
});

module.exports = Address;
