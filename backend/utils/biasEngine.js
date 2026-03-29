// ─────────────────────────────────────────────────────────────────────────────
// FairCart Bias Engine v2
// Strategy: Category Price Benchmark + Feature/Buzzword Similarity
// Never flags male products as pink-taxed
// ─────────────────────────────────────────────────────────────────────────────

const FEMALE_KEYWORDS = [
  "women", "woman", "female", "feminine", "her", "ladies", "lady",
  "girl", "girls", "pink", "venus", "pearl", "glow", "beauty", "floral",
  "she", "blossom", "rose", "violet", "silk", "soft", "gentle", "ubtan",
  "smooth", "nourishing", "bright", "enchant", "spell", "her", "goddess",
  "diva", "bloom", "radiant", "glow", "luminous", "delicate"
];

const MALE_KEYWORDS = [
  "men", "man", "male", "masculine", "his", "guys", "guy",
  "sport", "silver", "mach", "blue", "strong", "power", "bold",
  "edge", "titan", "iron", "acno", "charcoal", "urge", "energy",
  "beast", "gym", "active", "deep impact", "menthol"
];

// Feature/benefit buzzwords used to compare product similarity
const FEATURE_BUZZWORDS = [
  // Skin/hair benefits
  "moisturizing", "hydrating", "nourishing", "brightening", "whitening",
  "anti-dandruff", "anti-acne", "anti-aging", "clarifying", "soothing",
  "exfoliating", "volumizing", "strengthening", "repairing", "smoothing",
  "conditioning", "cleansing", "refreshing", "purifying", "detoxifying",
  // Ingredients
  "vitamin c", "keratin", "collagen", "charcoal", "neem", "aloe",
  "argan", "coconut", "shea", "glycerin", "salicylic", "spf",
  "hyaluronic", "retinol", "turmeric", "honey", "tea tree", "rose",
  "oat", "milk", "caffeine", "biotin", "zinc", "clay",
  // Product types
  "gel", "cream", "foam", "lotion", "serum", "oil", "spray", "roll-on",
  "stick", "balm", "mask", "scrub", "toner", "mist", "butter",
  // Skin types
  "oily", "dry", "sensitive", "combination", "normal", "all skin",
  // SPF
  "spf 30", "spf 40", "spf 50", "spf50", "pa++", "pa+++",
  // Claims
  "24h", "48h", "72h", "long lasting", "waterproof", "sweat proof",
  "dermatologist", "clinically tested", "natural", "organic", "vegan",
];

// ── Gender Detection ──────────────────────────────────────────────────────────
function detectGender(name, keywords = []) {
  const text = `${name} ${keywords.join(" ")}`.toLowerCase();
  const femaleScore = FEMALE_KEYWORDS.filter((kw) => text.includes(kw)).length;
  const maleScore = MALE_KEYWORDS.filter((kw) => text.includes(kw)).length;
  if (femaleScore > maleScore) return "female";
  if (maleScore > femaleScore) return "male";
  return "neutral";
}

function stripGenderedKeywords(name) {
  let normalized = name.toLowerCase();
  [...FEMALE_KEYWORDS, ...MALE_KEYWORDS].forEach((kw) => {
    normalized = normalized.replace(new RegExp(`\\b${kw}\\b`, "gi"), "").trim();
  });
  return normalized.replace(/\s+/g, " ").trim();
}

// ── Feature Extraction ────────────────────────────────────────────────────────
function extractFeatures(product) {
  const text = `${product.name} ${product.description || ""} ${(product.keywords || []).join(" ")}`.toLowerCase();
  return FEATURE_BUZZWORDS.filter((f) => text.includes(f));
}

// ── Feature Match % ───────────────────────────────────────────────────────────
// Compares two products based on shared features/buzzwords
function calculateFeatureMatch(productA, productB) {
  const featA = extractFeatures(productA);
  const featB = extractFeatures(productB);

  if (featA.length === 0 && featB.length === 0) {
    // Fall back to brand match + category
    let score = 0;
    if (productA.brand?.toLowerCase() === productB.brand?.toLowerCase()) score += 50;
    if (productA.category === productB.category) score += 50;
    return score;
  }

  const union = new Set([...featA, ...featB]);
  const intersection = featA.filter((f) => featB.includes(f));

  // Jaccard similarity × 100
  const jaccard = Math.round((intersection.length / union.size) * 100);

  // Boost if same brand
  const brandBoost = productA.brand?.toLowerCase() === productB.brand?.toLowerCase() ? 15 : 0;

  return Math.min(jaccard + brandBoost, 100);
}

// ── Category Price Benchmark ──────────────────────────────────────────────────
// Returns bias score by comparing product price to category median
// Only runs for female/neutral products — NEVER for male
function calculateCategoryBenchmarkBias(product, allCategoryProducts) {
  // Never flag male products
  if (product.gender === "male") return null;

  const validProducts = allCategoryProducts.filter(
    (p) => p.price > 0 && p._id?.toString() !== product._id?.toString()
  );

  if (validProducts.length < 2) return null;

  // Calculate median price
  const prices = validProducts.map((p) => p.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 !== 0
    ? prices[mid]
    : (prices[mid - 1] + prices[mid]) / 2;

  const priceDiff = product.price - median;
  const percentDiff = parseFloat(((priceDiff / median) * 100).toFixed(1));

  // Only flag if product is MORE expensive than median
  if (percentDiff <= 0) return null;

  let label = "Fair";
  let score = 0;
  if (percentDiff > 30) { label = "High"; score = 3; }
  else if (percentDiff > 15) { label = "Moderate"; score = 2; }
  else if (percentDiff > 5) { label = "Low"; score = 1; }

  return {
    score, label,
    priceDiff: Math.round(priceDiff),
    percentDiff,
    lifetimeCost: Math.round(priceDiff * 12),
    medianPrice: Math.round(median),
    method: "benchmark",
  };
}

// ── Legacy pair-based score (kept for mock DB fallback) ───────────────────────
function calculateBiasScore(femalePrice, malePrice) {
  if (!femalePrice || !malePrice) return null;
  if (femalePrice <= malePrice) return null; // No bias if female <= male

  const priceDiff = femalePrice - malePrice;
  const percentDiff = parseFloat(((priceDiff / malePrice) * 100).toFixed(1));

  let label = "Fair";
  let score = 0;
  if (percentDiff > 15) { label = "High"; score = 3; }
  else if (percentDiff > 5) { label = "Moderate"; score = 2; }
  else if (percentDiff > 0) { label = "Low"; score = 1; }

  return {
    score, label,
    priceDiff: Math.round(priceDiff),
    percentDiff,
    lifetimeCost: Math.round(priceDiff * 12),
    method: "pair",
  };
}

// ── Find Best Alternatives ────────────────────────────────────────────────────
// Finds cheaper products in same category, ranked by feature similarity
function findAlternatives(targetProduct, allProducts) {
  if (targetProduct.gender === "male") return [];

  return allProducts
    .filter(
      (p) =>
        p.category === targetProduct.category &&
        p._id?.toString() !== targetProduct._id?.toString() &&
        p.price < targetProduct.price &&
        p.gender !== "female" // prefer male or neutral alternatives
    )
    .map((p) => ({
      ...p,
      featureMatch: calculateFeatureMatch(targetProduct, p),
    }))
    .sort((a, b) => {
      // Sort by: feature match first, then price
      if (b.featureMatch !== a.featureMatch) return b.featureMatch - a.featureMatch;
      return a.price - b.price;
    })
    .slice(0, 3);
}

// ── Enrich live results with bias using benchmark method ──────────────────────
function enrichLiveResultsWithBias(products) {
  // Group by category
  const byCategory = {};
  products.forEach((p) => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  return products.map((p) => {
    // Never add bias to male products
    if (p.gender === "male") return { ...p, bias: null };

    const categoryGroup = byCategory[p.category] || [];
    const bias = calculateCategoryBenchmarkBias(p, categoryGroup);

    // Find alternatives from within the live results
    const alternatives = findAlternatives(p, categoryGroup);

    return { ...p, bias, alternatives };
  });
}

module.exports = {
  detectGender,
  stripGenderedKeywords,
  extractFeatures,
  calculateFeatureMatch,
  calculateCategoryBenchmarkBias,
  calculateBiasScore,
  findAlternatives,
  enrichLiveResultsWithBias,
};