import React, { useState } from "react";

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const suggestions = ["women's razor", "shampoo", "deodorant", "sunscreen", "body wash"];

  return (
    <div className="search-wrapper">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-group">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a product (e.g. women's razor, shampoo...)"
            className="search-input"
            disabled={loading}
          />
          <button type="submit" className="search-btn" disabled={loading || !query.trim()}>
            {loading ? <span className="spinner" /> : "Analyze"}
          </button>
        </div>
      </form>
      <div className="suggestions">
        <span className="suggestions-label">Try:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            className="suggestion-chip"
            onClick={() => { setQuery(s); onSearch(s); }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
