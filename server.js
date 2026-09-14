const app = require('./src/app');
const env = require('./src/config/env');
const { sequelize } = require('./src/models');

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(env.port, () => {
      console.log(`AUTS API démarrée sur http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('Échec du démarrage du serveur:', err);
    process.exit(1);
  }
}

start();
