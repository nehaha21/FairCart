import { useState } from "react";
import SearchBar from "./components/SearchBar";
import ResultCard from "./components/ResultCard";
import { compareProduct } from "./services/api";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (product) => {
    try {
      setLoading(true);
      const res = await compareProduct(product);
      setResult(res.data);
    } catch (err) {
      alert("Make sure backend is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">🛍️ FairCart</h1>

      <div className="w-full max-w-md">
        <SearchBar onSearch={handleSearch} />

        {loading && <p className="mt-4">Loading...</p>}

        <ResultCard data={result} />
      </div>
    </div>
  );
}
