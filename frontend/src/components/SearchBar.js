import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [input, setInput] = useState("");

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Search product (e.g. women razor)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="p-2 border rounded w-full"
      />
      <button
        onClick={() => onSearch(input)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Search
      </button>
    </div>
  );
}
