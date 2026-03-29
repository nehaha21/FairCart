// Gendered keywords to strip/detect
const FEMALE_KEYWORDS = [
  "women", "woman", "female", "feminine", "her", "ladies", "lady",
  "girl", "girls", "pink", "venus", "pearl", "glow", "beauty", "floral",
  "she", "blossom", "rose", "violet", "silk", "soft", "gentle"
];

const MALE_KEYWORDS = [
  "men", "man", "male", "masculine", "his", "guys", "guy",
  "sport", "silver", "mach", "blue", "strong", "power", "bold",
  "edge", "titan", "iron"
];

/**
 * Detect gender of a product from its name/keywords
 */
function detectGender(name, keywords = []) {
  const text = `${name} ${keywords.join(" ")}`.toLowerCase();

  const femaleScore = FEMALE_KEYWORDS.filter((kw) => text.includes(kw)).length;
  const maleScore = MALE_KEYWORDS.filter((kw) => text.includes(kw)).length;

  if (femaleScore > maleScore) return "female";
  if (maleScore > femaleScore) return "male";
  return "neutral";
}

/**
 * Strip gendered keywords from a product name to get a neutral search term
 */
function stripGenderedKeywords(name) {
  let normalized = name.toLowerCase();
  [...FEMALE_KEYWORDS, ...MALE_KEYWORDS].forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    normalized = normalized.replace(regex, "").trim();
  });
  // Clean extra spaces
  return normalized.replace(/\s+/g, " ").trim();
}

/**
 * Calculate bias score between female and male/neutral priced products
 * Returns: { score, label, priceDiff, percentDiff, lifetimeCost }
 */
function calculateBiasScore(femalePrice, malePrice) {
  if (!femalePrice || !malePrice) return null;

  const priceDiff = femalePrice - malePrice;
  const percentDiff = ((priceDiff / malePrice) * 100).toFixed(1);

  let label = "Fair";
  let score = 0;

  if (percentDiff > 15) {
    label = "High";
    score = 3;
  } else if (percentDiff > 5) {
    label = "Moderate";
    score = 2;
  } else if (percentDiff > 0) {
    label = "Low";
    score = 1;
  }

  // Lifetime cost: assume buying once a month, over 12 months
  const lifetimeCost = priceDiff * 12;

  return { score, label, priceDiff, percentDiff: parseFloat(percentDiff), lifetimeCost };
}

/**
 * Find best matching alternative products (male/neutral) for a given female product
 */
function findAlternatives(targetProduct, allProducts) {
  return allProducts
    .filter(
      (p) =>
        p.category === targetProduct.category &&
        p._id?.toString() !== targetProduct._id?.toString() &&
        (p.gender === "male" || p.gender === "neutral") &&
        p.price <= targetProduct.price
    )
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);
}

module.exports = { detectGender, stripGenderedKeywords, calculateBiasScore, findAlternatives };
