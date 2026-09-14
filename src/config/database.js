const path = require('path');
const { Sequelize } = require('sequelize');
const env = require('./env');

let sequelize;

if (env.databaseUrl) {
  // Production (Vercel + Postgres serverless : Vercel Postgres, Neon, Supabase...).
  // Ces fournisseurs exigent SSL et n'exposent pas toujours un certificat vérifiable
  // depuis l'environnement de la fonction serverless, d'où rejectUnauthorized: false.
  // SSL désactivé automatiquement pour un Postgres local (docker) utilisé en dev/tests.
  const host = new URL(env.databaseUrl).hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const useSsl = process.env.DATABASE_SSL
    ? process.env.DATABASE_SSL !== 'false'
    : !isLocalHost;

  sequelize = new Sequelize(env.databaseUrl, {
    dialect: 'postgres',
    logging: false,
    define: { underscored: true },
    dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    pool: { max: 3, min: 0, idle: 10000, acquire: 20000 }
  });
} else {
  // Développement local : fichier SQLite (ou ':memory:' pour les tests).
  const storage = env.databasePath === ':memory:' || path.isAbsolute(env.databasePath)
    ? env.databasePath
    : path.join(__dirname, '..', '..', env.databasePath);

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
    define: { underscored: true }
  });
}

module.exports = sequelize;
