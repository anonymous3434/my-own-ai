import { useState } from "react";

export default function LeftPanel({ onSearch }) {
  const [query, setQuery] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ color: "#aaa", fontSize: "12px" }}>Search</div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="binary tree, pizza..."
        style={{
          padding: "8px",
          background: "#07070f",
          border: "1px solid #151528",
          color: "white",
          borderRadius: "6px",
        }}
      />

      <button
        onClick={() => onSearch(query)}
        style={{
          padding: "8px",
          background: "#6c63ff",
          border: "none",
          color: "white",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Search
      </button>
    </div>
  );
}
