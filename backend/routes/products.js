const express = require("express");
const router = express.Router();
const Product = require("../utils/productModel");
const {
  detectGender,
  stripGenderedKeywords,
  calculateBiasScore,
  calculateCategoryBenchmarkBias,
  findAlternatives,
  enrichLiveResultsWithBias,
} = require("../utils/biasEngine");
const { searchRealProducts } = require("../utils/serpApi");

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query required" });

    const detectedGender = detectGender(q, []);
    const neutralQuery = stripGenderedKeywords(q);

    const liveResults = await searchRealProducts(q);

    if (liveResults && liveResults.length > 0) {
      const enriched = enrichLiveResultsWithBias(liveResults);
      return res.json({ products: enriched, detectedGender, neutralQuery, source: "live" });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: neutralQuery || q, $options: "i" } },
        { brand: { $regex: neutralQuery || q, $options: "i" } },
        { category: { $regex: neutralQuery || q, $options: "i" } },
        { keywords: { $in: [q.toLowerCase()] } },
      ],
    }).limit(20);

    if (products.length === 0)
      return res.json({ products: [], detectedGender, message: "No products found", source: "mock" });

    const allByCategory = {};
    for (const p of products) {
      if (!allByCategory[p.category]) {
        allByCategory[p.category] = await Product.find({ category: p.category });
      }
    }

    const enriched = products.map((product) => {
      const p = product.toObject();
      if (p.gender === "male") return { ...p, bias: null };

      const categoryProducts = (allByCategory[p.category] || []).map((x) =>
        x.toObject ? x.toObject() : x
      );

      let bias = calculateCategoryBenchmarkBias(p, categoryProducts);

      if (!bias) {
        const sameCategory = products.filter(
          (x) => x.category === p.category &&
                 x._id.toString() !== p._id.toString() &&
                 x.gender !== p.gender
        );
        const alternative = sameCategory.sort((a, b) => a.price - b.price)[0];
        if (p.gender === "female" && alternative && alternative.price < p.price) {
          bias = calculateBiasScore(p.price, alternative.price);
        }
      }

      return { ...p, bias };
    });

    res.json({ products: enriched, detectedGender, neutralQuery, source: "mock" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/analyze/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (id.startsWith("serp_")) {
      const rawProduct = req.query.product
        ? JSON.parse(decodeURIComponent(req.query.product))
        : null;
      if (!rawProduct) return res.status(400).json({ error: "Product data required" });

      const dbProducts = await Product.find({ category: rawProduct.category }).lean();
      const alternatives = findAlternatives(rawProduct, dbProducts);
      const bias = calculateCategoryBenchmarkBias(rawProduct, dbProducts);

      return res.json({
        product: rawProduct,
        alternatives,
        biasScore: bias,
        categoryAvgFemale: await getCategoryAvg(rawProduct.category, "female"),
        categoryAvgMale: await getCategoryAvg(rawProduct.category, "male"),
        source: "live",
      });
    }

    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });

    const allInCategory = await Product.find({ category: product.category }).lean();
    const alternatives = findAlternatives(product, allInCategory);

    const bias = calculateCategoryBenchmarkBias(product, allInCategory)
      || (product.gender === "female" && alternatives.length > 0
        ? calculateBiasScore(product.price, alternatives[0].price)
        : null);

    res.json({
      product,
      alternatives,
      biasScore: bias,
      categoryAvgFemale: await getCategoryAvg(product.category, "female"),
      categoryAvgMale: await getCategoryAvg(product.category, "male"),
      source: "mock",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    const stats = [];
    for (const cat of categories) {
      const femaleProducts = await Product.find({ category: cat, gender: "female" }).lean();
      const maleProducts = await Product.find({ category: cat, gender: "male" }).lean();
      if (femaleProducts.length && maleProducts.length) {
        const avgFemale = femaleProducts.reduce((s, p) => s + p.price, 0) / femaleProducts.length;
        const avgMale = maleProducts.reduce((s, p) => s + p.price, 0) / maleProducts.length;
        stats.push({ category: cat, avgFemale, avgMale, bias: calculateBiasScore(avgFemale, avgMale) });
      }
    }
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    res.json({ categories: await Product.distinct("category") });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getCategoryAvg(category, gender) {
  const products = await Product.find({ category, gender }).lean();
  if (!products.length) return null;
  return products.reduce((s, p) => s + p.price, 0) / products.length;
}

module.exports = router;