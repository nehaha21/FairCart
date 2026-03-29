import React, { useState } from "react";
import SearchBar from "./components/SearchBar";
import ResultCard from "./components/ResultCard";
import AnalysisModal from "./components/AnalysisModal";
import StatsBar from "./components/StatsBar";
import { searchProducts, analyzeProduct } from "./services/api";
import "./index.css";

export default function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalData, setModalData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [detectedGender, setDetectedGender] = useState(null);

  const handleSearch = async (query) => {
    setLoading(true);
    setError("");
    setResults([]);
    setSearched(true);
    try {
      const res = await searchProducts(query);
      setResults(res.data.products || []);
      setDetectedGender(res.data.detectedGender);
    } catch (err) {
      setError("Failed to fetch products. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (id) => {
    try {
      const res = await analyzeProduct(id);
      setModalData(res.data);
    } catch (err) {
      setError("Analysis failed.");
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🛒</span>
          <span className="logo-text">FairCart</span>
          <span className="logo-sub">Pink Tax Detector</span>
        </div>
        <p className="tagline">
          Exposing the hidden cost of gendered pricing — in real time.
        </p>
      </header>

      {/* Search */}
      <main className="main">
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Stats */}
        <StatsBar />

        {/* Error */}
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div className="loading-ring" />
            <p>Analyzing gendered pricing...</p>
          </div>
        )}

        {/* Results */}
        {searched && !loading && results.length === 0 && !error && (
          <div className="empty-state">
            <span>🔎</span>
            <p>No products found. Try a different search.</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="results-header">
              <h2 className="results-title">
                {results.length} product{results.length > 1 ? "s" : ""} found
                {detectedGender && detectedGender !== "neutral" && (
                  <span className="gender-detected">
                    · Detected: <strong>{detectedGender}</strong> product
                  </span>
                )}
              </h2>
            </div>
            <div className="results-grid">
              {results.map((p) => (
                <ResultCard key={p._id} product={p} onAnalyze={handleAnalyze} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Built for Hackfinity · FairCart by Team Cali · PES University</p>
      </footer>

      {/* Modal */}
      {modalData && (
        <AnalysisModal data={modalData} onClose={() => setModalData(null)} />
      )}
    </div>
  );
}
