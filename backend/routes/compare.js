const express = require("express");
const router = express.Router();

const cleanKeywords = require("../services/keywordCleaner");
const matchProducts = require("../services/productMatcher");
const comparePrices = require("../services/priceComparator");
const getBiasScore = require("../services/biasScorer");

const data = require("../../database/mockData.json");router.post("/", (req, res) => {
  const { product } = req.body;

  if (!product) {
    return res.status(400).json({ error: "Product required" });
  }

  // Step 1: Clean keywords
  const cleaned = cleanKeywords(product);

  // Step 2: Find matches
  const matches = matchProducts(cleaned, data);

  // Step 3: Compare prices
  const comparison = comparePrices(product, matches, data);

  // Step 4: Score bias
  const bias = getBiasScore(comparison.originalPrice, comparison.bestPrice);

  res.json({
    input: product,
    cleaned,
    alternatives: matches,
    originalPrice: comparison.originalPrice,
    bestAlternative: comparison.bestProduct,
    bestPrice: comparison.bestPrice,
    biasScore: bias.label,
    savings: comparison.originalPrice - comparison.bestPrice
  });
});

module.exports = router;