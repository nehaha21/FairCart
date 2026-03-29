// ─────────────────────────────────────────────────────────────────────────────
// FairCart Bias Engine v3
// Strategy: Category Price Benchmark + Dynamic Feature Similarity
// Extracts ingredients/features dynamically — catches "strawberry", "coffee" etc.
// NEVER flags male products
// ─────────────────────────────────────────────────────────────────────────────

const FEMALE_KEYWORDS = [
  "women", "woman", "female", "feminine", "her", "ladies", "lady",
  "girl", "girls", "pink", "venus", "pearl", "glow", "beauty", "floral",
  "she", "blossom", "rose", "violet", "silk", "soft", "gentle", "ubtan",
  "smooth", "nourishing", "bright", "enchant", "spell", "goddess",
  "diva", "bloom", "radiant", "luminous", "delicate"
];

const MALE_KEYWORDS = [
  "men", "man", "male", "masculine", "his", "guys", "guy",
  "sport", "silver", "mach", "blue", "strong", "power", "bold",
  "edge", "titan", "iron", "acno", "charcoal", "urge", "energy",
  "beast", "gym", "active", "deep impact", "menthol"
];

// Generic words too vague to use for matching
const STOP_WORDS = new Set([
  "for", "and", "the", "with", "a", "an", "of", "in", "to", "by",
  "is", "it", "ml", "gm", "g", "kg", "oz", "fl", "pack", "set",
  "best", "new", "buy", "get", "free", "offer", "sale", "price",
  "product", "brand", "care", "daily", "use", "skin", "hair", "body",
  "face", "wash", "cream", "lotion", "gel", "spray", "serum", "oil",
  "soap", "bar", "tube", "bottle", "size", "type", "color", "colour",
  "good", "great", "top", "high", "low", "rich", "pure", "natural",
  "women", "woman", "female", "feminine", "her", "ladies", "lady",
  "girl", "girls", "pink", "venus", "pearl", "glow", "beauty", "floral",
  "she", "blossom", "rose", "violet", "silk", "soft", "gentle", "ubtan",
  "smooth", "nourishing", "bright", "enchant", "spell", "goddess",
  "diva", "bloom", "radiant", "luminous", "delicate",
  "men", "man", "male", "masculine", "his", "guys", "guy",
  "sport", "silver", "mach", "blue", "strong", "power", "bold",
  "edge", "titan", "iron", "acno", "charcoal", "urge", "energy",
  "beast", "gym", "active", "menthol"
]);

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

// ── Dynamic Feature Extraction ────────────────────────────────────────────────
// Pulls meaningful tokens from product name + description dynamically
// Catches "strawberry", "coffee", "papaya", "cucumber", "spf50" etc. automatically
function extractFeatures(product) {
  const rawText = [
    product.name || "",
    product.description || "",
    ...(product.keywords || []),
  ].join(" ").toLowerCase();

  // Tokenize
  const tokens = rawText
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  // Bigrams for compound terms like "vitamin c", "spf 50", "tea tree"
  const rawTokens = rawText.replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
  const bigrams = [];
  for (let i = 0; i < rawTokens.length - 1; i++) {
    const a = rawTokens[i], b = rawTokens[i + 1];
    if (a.length > 2 && b.length > 2 && !STOP_WORDS.has(a) && !STOP_WORDS.has(b)) {
      bigrams.push(`${a} ${b}`);
    }
  }

  return [...new Set([...tokens, ...bigrams])];
}

// ── Feature Match % ───────────────────────────────────────────────────────────
// Jaccard similarity on dynamically extracted features
// "strawberry face wash" vs "strawberry scrub for men" → match on "strawberry"
function calculateFeatureMatch(productA, productB) {
  const featA = extractFeatures(productA);
  const featB = extractFeatures(productB);

  if (featA.length === 0 && featB.length === 0) return 50;

  const setA = new Set(featA);
  const setB = new Set(featB);
  const intersection = [...setA].filter((f) => setB.has(f));
  const union = new Set([...setA, ...setB]);

  const jaccard = union.size > 0
    ? Math.round((intersection.length / union.size) * 100)
    : 0;

  const sameBrand = productA.brand?.toLowerCase() === productB.brand?.toLowerCase();

  return Math.min(jaccard + (sameBrand ? 15 : 0) + 10, 100); // +10 category always true
}

// ── Category Price Benchmark Bias ─────────────────────────────────────────────
function calculateCategoryBenchmarkBias(product, allCategoryProducts) {
  if (product.gender === "male") return null;

  const validProducts = allCategoryProducts.filter(
    (p) => p.price > 0 && p._id?.toString() !== product._id?.toString()
  );

  if (validProducts.length < 2) return null;

  const prices = validProducts.map((p) => p.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 !== 0
    ? prices[mid]
    : (prices[mid - 1] + prices[mid]) / 2;

  const priceDiff = product.price - median;
  const percentDiff = parseFloat(((priceDiff / median) * 100).toFixed(1));

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

// ── Legacy pair-based score (mock DB fallback) ────────────────────────────────
function calculateBiasScore(femalePrice, malePrice) {
  if (!femalePrice || !malePrice || femalePrice <= malePrice) return null;
  const priceDiff = femalePrice - malePrice;
  const percentDiff = parseFloat(((priceDiff / malePrice) * 100).toFixed(1));
  let label = "Fair"; let score = 0;
  if (percentDiff > 15) { label = "High"; score = 3; }
  else if (percentDiff > 5) { label = "Moderate"; score = 2; }
  else if (percentDiff > 0) { label = "Low"; score = 1; }
  return { score, label, priceDiff: Math.round(priceDiff), percentDiff, lifetimeCost: Math.round(priceDiff * 12), method: "pair" };
}

// ── Find Fairer Alternatives ──────────────────────────────────────────────────
// 1. Only male/neutral products
// 2. Must be cheaper
// 3. Ranked by feature similarity — same ingredients/benefits first
// 4. Returns sharedFeatures so UI can show WHY they match
function findAlternatives(targetProduct, allProducts) {
  if (targetProduct.gender === "male") return [];

  const targetFeatures = new Set(extractFeatures(targetProduct));

  return allProducts
    .filter(
      (p) =>
        p.category === targetProduct.category &&
        p._id?.toString() !== targetProduct._id?.toString() &&
        p.price < targetProduct.price &&
        p.gender !== "female"
    )
    .map((p) => {
      const altFeatures = extractFeatures(p);
      const featureMatch = calculateFeatureMatch(targetProduct, p);
      const sharedFeatures = altFeatures
        .filter((f) => targetFeatures.has(f) && f.length > 3)
        .slice(0, 5);
      return { ...p, featureMatch, sharedFeatures };
    })
    .sort((a, b) =>
      b.featureMatch !== a.featureMatch
        ? b.featureMatch - a.featureMatch
        : a.price - b.price
    )
    .slice(0, 3);
}

// ── Enrich Live SerpAPI Results ───────────────────────────────────────────────
function enrichLiveResultsWithBias(products) {
  const byCategory = {};
  products.forEach((p) => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  return products.map((p) => {
    if (p.gender === "male") return { ...p, bias: null };
    const categoryGroup = byCategory[p.category] || [];
    const bias = calculateCategoryBenchmarkBias(p, categoryGroup);
    const alternatives = findAlternatives(p, categoryGroup);
    return { ...p, bias, alternatives };
  });
}

module.exports = {
  detectGender, stripGenderedKeywords, extractFeatures,
  calculateFeatureMatch, calculateCategoryBenchmarkBias,
  calculateBiasScore, findAlternatives, enrichLiveResultsWithBias,
};