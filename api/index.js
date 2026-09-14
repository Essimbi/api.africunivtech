// Point d'entrée serverless pour Vercel (@vercel/node). Le serveur local classique
// (npm run dev / npm start) utilise toujours backend/server.js — ce fichier expose
// la même app Express sans app.listen(), tel qu'attendu par le runtime Vercel.
const app = require('../src/app');

module.exports = app;
