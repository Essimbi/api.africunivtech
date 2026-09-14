const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  company: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM('client', 'admin', 'superadmin'), defaultValue: 'client', allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpires: { type: DataTypes.DATE }
}, {
  tableName: 'users'
});

module.exports = User;
