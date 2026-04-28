import { useState } from "react";
import LeftPanel from "./LeftPanel";
import ScatterPlot from "./ScatterPlot";

export default function Layout() {
  const [loading, setLoading] = useState(false);

  function handleSearch(query) {
    // we will send this to graph
    window.dispatchEvent(new CustomEvent("vector-search", { detail: query }));
  }
  return (
    <div
      style={{
        display: "flex",
        height: "calc(100% - 60px)",
        width: "100%",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          width: "260px",
          flexShrink: 0, // 🔥 IMPORTANT
          background: "#0c0c18",
          borderRight: "1px solid #151528",
          padding: "16px",
          color: "white",
        }}
      >
        <LeftPanel onSearch={handleSearch} />
      </div>

      {/* CENTER GRAPH */}
      <div style={{ flex: 1 }}>
        <ScatterPlot loading={loading} setLoading={setLoading} />
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          width: "320px",
          flexShrink: 0, // 🔥 IMPORTANT
          background: "#0c0c18",
          borderLeft: "1px solid #151528",
          padding: "16px",
          color: "white",
        }}
      >
        Right Panel
      </div>
    </div>
  );
}
