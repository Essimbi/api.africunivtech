require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  databasePath: process.env.DATABASE_PATH || './database.sqlite',
  // Présent en production (Vercel Postgres / Neon / toute base Postgres) : bascule
  // automatiquement le dialecte Sequelize, voir src/config/database.js.
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || null,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  // Liste d'origines séparées par des virgules (prod + previews Vercel par ex.).
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  business: {
    vatRate: parseFloat(process.env.VAT_RATE || '0.1925'),
    freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '500000'),
    defaultShippingFee: parseFloat(process.env.DEFAULT_SHIPPING_FEE || '10000')
  }
};
