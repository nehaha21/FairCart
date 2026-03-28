function comparePrices(original, matches, data) {
  const originalItem = data.find(item =>
    item.name.toLowerCase() === original.toLowerCase()
  );

  const originalPrice = originalItem ? originalItem.price : 0;

  let bestProduct = null;
  let bestPrice = Infinity;

  matches.forEach(item => {
    if (item.price < bestPrice) {
      bestPrice = item.price;
      bestProduct = item.name;
    }
  });

  return {
    originalPrice,
    bestProduct,
    bestPrice
  };
}

module.exports = comparePrices;