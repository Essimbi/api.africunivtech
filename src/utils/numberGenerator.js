const { v4: uuidv4 } = require('uuid');

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const suffix = uuidv4().split('-')[0].toUpperCase();
  return `AUTS-${year}-${suffix}`;
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const suffix = uuidv4().split('-')[0].toUpperCase();
  return `FAC-${year}-${suffix}`;
}

module.exports = { generateOrderNumber, generateInvoiceNumber };
