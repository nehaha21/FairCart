import React from "react";

const BIAS_CONFIG = {
  High:     { color: "#ef4444", label: "High Pink Tax", emoji: "🔴" },
  Moderate: { color: "#f97316", label: "Moderate Pink Tax", emoji: "🟠" },
  Low:      { color: "#eab308", label: "Low Pink Tax", emoji: "🟡" },
  Fair:     { color: "#22c55e", label: "Fairly Priced", emoji: "🟢" },
};

function MatchBar({ score }) {
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#f97316" : "#6b7280";
  const label = score >= 70 ? "Strong match" : score >= 45 ? "Partial match" : "Low match";
  return (
    <div className="match-bar-wrap">
      <div className="match-bar-header">
        <span className="match-label">{label}</span>
        <span className="match-score" style={{ color }}>{score}% feature match</span>
      </div>
      <div className="match-bar-bg">
        <div className="match-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

export default function AnalysisModal({ data, onClose }) {
  if (!data) return null;
  const { product, alternatives, biasScore, categoryAvgFemale, categoryAvgMale } = data;
  const cfg = biasScore ? BIAS_CONFIG[biasScore.label] || BIAS_CONFIG["Fair"] : BIAS_CONFIG["Fair"];

  // Don't show bias section for male products
  const showBias = product.gender !== "male" && biasScore && biasScore.priceDiff > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="modal-header">
          <h2>{product.name}</h2>
          <span className="modal-brand">
            {product.brand} · <span style={{ textTransform: "capitalize" }}>
              {(product.category || "").replace(/_/g, " ")}
            </span>
          </span>
          {product.productUrl && (
            <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="modal-buy-link">
              View on store ↗
            </a>
          )}
        </div>

        {/* Bias Score */}
        {showBias ? (
          <div className="modal-bias" style={{ borderColor: cfg.color }}>
            <div className="modal-bias-label" style={{ color: cfg.color }}>
              {cfg.emoji} {cfg.label}
            </div>
            <div className="modal-stats">
              <div className="stat">
                <span className="stat-val">₹{product.price}</span>
                <span className="stat-label">This Product</span>
              </div>
              <div className="stat-arrow">→</div>
              <div className="stat">
                <span className="stat-val" style={{ color: "#22c55e" }}>
                  ₹{biasScore.medianPrice || alternatives[0]?.price || "N/A"}
                </span>
                <span className="stat-label">
                  {biasScore.method === "benchmark" ? "Category Median" : "Equivalent"}
                </span>
              </div>
              <div className="stat">
                <span className="stat-val" style={{ color: cfg.color }}>
                  +{biasScore.percentDiff}%
                </span>
                <span className="stat-label">Markup</span>
              </div>
              <div className="stat">
                <span className="stat-val" style={{ color: cfg.color }}>
                  ₹{biasScore.lifetimeCost?.toLocaleString()}
                </span>
                <span className="stat-label">Extra/Year</span>
              </div>
            </div>
            <p className="bias-method-note">
              {biasScore.method === "benchmark"
                ? "📊 Compared against category median price across all similar products"
                : "📊 Compared against equivalent gendered product"}
            </p>
          </div>
        ) : (
          <div className="modal-fair">
            🟢 {product.gender === "male"
              ? "This is a men's product — no pink tax analysis applied."
              : "This product is fairly priced within its category."}
          </div>
        )}

        {/* Category Average */}
        {categoryAvgFemale && categoryAvgMale && (
          <div className="category-avg">
            <h4>📊 Category Average — {(product.category || "").replace(/_/g, " ")}</h4>
            <div className="avg-row">
              <div className="avg-bar-label">Women's avg: ₹{Math.round(categoryAvgFemale)}</div>
              <div className="avg-bar-bg">
                <div className="avg-bar-fill female"
                  style={{ width: `${(categoryAvgFemale / (categoryAvgFemale + categoryAvgMale)) * 100}%` }} />
              </div>
            </div>
            <div className="avg-row">
              <div className="avg-bar-label">Men's avg: ₹{Math.round(categoryAvgMale)}</div>
              <div className="avg-bar-bg">
                <div className="avg-bar-fill male"
                  style={{ width: `${(categoryAvgMale / (categoryAvgFemale + categoryAvgMale)) * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Fairer Alternatives */}
        {alternatives?.length > 0 && product.gender !== "male" && (
          <div className="alternatives">
            <h4>💚 Fairer Alternatives</h4>
            <p className="alt-subtitle">
              Same features, no gendered markup — ranked by ingredient & benefit match
            </p>
            <div className="alt-grid">
              {alternatives.map((alt, i) => (
                <div key={alt._id || i} className="alt-card">
                  <img
                    src={alt.image || alt.thumbnail || "https://via.placeholder.com/64"}
                    alt={alt.name}
                    className="alt-img"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/64?text=🛒"; }}
                  />
                  <div className="alt-info">
                    {(alt.productUrl || alt.productLink) ? (
                      <a href={alt.productUrl || alt.productLink} target="_blank" rel="noopener noreferrer" className="alt-name-link">
                        {alt.name} ↗
                      </a>
                    ) : (
                      <div className="alt-name">{alt.name}</div>
                    )}
                    <div className="alt-price">₹{alt.price}</div>
                    <div className="alt-save">
                      Save ₹{product.price - alt.price} · ₹{(product.price - alt.price) * 12}/yr
                    </div>

                    {/* Feature Match Bar */}
                    {alt.featureMatch !== undefined && (
                      <MatchBar score={alt.featureMatch} />
                    )}

                    {/* Shared Features Tags */}
                    {alt.sharedFeatures?.length > 0 && (
                      <div className="shared-features">
                        <span className="shared-label">Matched on: </span>
                        {alt.sharedFeatures.map((f, j) => (
                          <span key={j} className="feature-tag">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}