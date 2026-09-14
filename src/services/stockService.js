const ApiError = require('../utils/ApiError');
const { Product, ProductVariant } = require('../models');

/**
 * Resolves the stock-bearing record for a cart/order line: the variant if one is
 * selected, otherwise the product itself.
 */
async function getStockTarget(productId, variantId, transaction) {
  if (variantId) {
    const variant = await ProductVariant.findOne({
      where: { id: variantId, productId },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    if (!variant) throw new ApiError(404, 'Variante produit introuvable.');
    return { record: variant, availableStock: variant.stock };
  }
  const product = await Product.findByPk(productId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });
  if (!product) throw new ApiError(404, 'Produit introuvable.');
  return { record: product, availableStock: product.stock };
}

async function assertAvailable(productId, variantId, quantity, transaction) {
  const { availableStock } = await getStockTarget(productId, variantId, transaction);
  if (availableStock < quantity) {
    throw new ApiError(409, `Stock insuffisant (disponible: ${availableStock}).`);
  }
}

async function decrementStock(productId, variantId, quantity, transaction) {
  const { record, availableStock } = await getStockTarget(productId, variantId, transaction);
  if (availableStock < quantity) {
    throw new ApiError(409, `Stock insuffisant (disponible: ${availableStock}).`);
  }
  record.stock = availableStock - quantity;
  await record.save({ transaction });
}

async function restockItem(productId, variantId, quantity, transaction) {
  const { record, availableStock } = await getStockTarget(productId, variantId, transaction);
  record.stock = availableStock + quantity;
  await record.save({ transaction });
}

module.exports = { getStockTarget, assertAvailable, decrementStock, restockItem };
