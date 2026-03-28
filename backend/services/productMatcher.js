function matchProducts(query, data) {
  return data.filter(item =>
    item.name.toLowerCase().includes(query)
  );
}

module.exports = matchProducts;