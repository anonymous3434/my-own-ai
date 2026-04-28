import { useEffect, useRef, useState } from "react";
import { PCA } from "ml-pca";

function generateCluster(cx, cy, count, spread) {
  return Array.from({ length: count }, () => ({
    x: cx + (Math.random() - 0.5) * spread,
    y: cy + (Math.random() - 0.5) * spread,
    label: "Vector",
  }));
}

export default function ScatterPlot({ loading, setLoading }) {
  const canvasRef = useRef();

  const pointsRef = useRef([]);
  const hoveredRef = useRef(null);

  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  const queryRef = useRef(null);
  const resultsRef = useRef([]);

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const [tooltip, setTooltip] = useState(null);
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    // normalized points
    pointsRef.current = [
      ...generateCluster(0.3, 0.3, 20, 0.15),
      ...generateCluster(0.7, 0.6, 20, 0.15),
      ...generateCluster(0.5, 0.2, 20, 0.15),
    ];

    function worldToScreen(p) {
      const scale = scaleRef.current;
      const offset = offsetRef.current;

      return {
        x: p.x * canvas.width * scale + offset.x,
        y: p.y * canvas.height * scale + offset.y,
      };
    }
    function normalize(points) {
      let minX = Infinity,
        maxX = -Infinity;
      let minY = Infinity,
        maxY = -Infinity;

      // 🔍 Step 1: find bounds
      points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      // 🛠️ Step 2: scale into 0 → 1
      return points.map((p) => ({
        ...p,
        x: (p.x - minX) / (maxX - minX || 1),
        y: (p.y - minY) / (maxY - minY || 1),
      }));
    }

    function pca2D(vectors) {
      const pca = new PCA(vectors);

      const result = pca.predict(vectors, {
        nComponents: 2,
      });

      return result.to2DArray();
    }

    async function loadData() {
      try {
        const res = await fetch("http://localhost:3000/items");
        const data = await res.json();

        const rawPoints = data.map((item) => ({
          id: item.id,
          text: item.text,
          vector: item.vector,
        }));

        // 🔥 apply PCA
        const coords = pca2D(rawPoints.map((p) => p.vector));

        // attach x,y
        const withCoords = rawPoints.map((p, i) => ({
          ...p,
          x: coords[i][0],
          y: coords[i][1],
        }));

        const normalized = normalize(withCoords);

        pointsRef.current = normalized;
      } catch (err) {
        console.error(err);
      }
    }

    loadData();

    function runFakeSearch(e) {
      if (isDragging.current) return;
      const rect = canvas.getBoundingClientRect();

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const scale = scaleRef.current;
      const offset = offsetRef.current;

      // 🔥 Convert screen → world coordinates
      const worldX = (mx - offset.x) / (canvas.width * scale);
      const worldY = (my - offset.y) / (canvas.height * scale);

      const q = { x: worldX, y: worldY };
      queryRef.current = q;

      // compute distances
      const distances = pointsRef.current.map((p) => {
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        return { point: p, dist: Math.hypot(dx, dy) };
      });

      distances.sort((a, b) => a.dist - b.dist);

      resultsRef.current = distances.slice(0, 5).map((d) => d.point);
    }

    function getNearest(mx, my) {
      let min = Infinity;
      let nearest = null;

      for (let p of pointsRef.current) {
        const { x, y } = worldToScreen(p);
        const d = Math.hypot(x - mx, y - my);

        if (d < min && d < 12) {
          min = d;
          nearest = p;
        }
      }

      return nearest;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = loading ? 0.3 : 1;
      //draw lines
      if (queryRef.current && resultsRef.current.length) {
        const q = worldToScreen(queryRef.current);

        resultsRef.current.forEach((p) => {
          const pt = worldToScreen(p);

          ctx.beginPath();
          ctx.moveTo(q.x, q.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.strokeStyle = "rgba(108,99,255,0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
      //draw points
      pointsRef.current.forEach((p) => {
        const { x, y } = worldToScreen(p);
        const isNeighbor = resultsRef.current.includes(p);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = isNeighbor ? "#6c63ff" : "#00d9ff";
        ctx.fill();

        if (hoveredRef.current === p) {
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = "#00d9ff";
          ctx.stroke();
        }
      });
      //draw Star
      if (queryRef.current) {
        const { x, y } = worldToScreen(queryRef.current);

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();

        // star shape
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const r = i % 2 === 0 ? 10 : 4;
          const sx = x + Math.cos(angle) * r;
          const sy = y + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }

        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(draw);
    }

    draw();

    // 🖱️ MOUSE MOVE
    function handleMove(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // PAN
      if (isDragging.current) {
        const dx = mx - lastMouse.current.x;
        const dy = my - lastMouse.current.y;

        offsetRef.current.x += dx;
        offsetRef.current.y += dy;
      }

      lastMouse.current = { x: mx, y: my };

      const nearest = getNearest(mx, my);
      hoveredRef.current = nearest;
      if (nearest && hoveredRef.current) {
        setTooltip({ x: mx, y: my, label: nearest.text });
      } else {
        setTooltip(null);
      }
    }

    function handleDown() {
      isDragging.current = true;
    }

    function handleUp() {
      isDragging.current = false;
    }

    // 🧲 ZOOM
    function handleWheel(e) {
      e.preventDefault();

      const zoomFactor = 1.1;
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      const oldScale = scaleRef.current;

      let newScale =
        e.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor;

      // 🔥 clamp scale
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

      // ❗ If scale didn't change → stop
      if (newScale === oldScale) return;

      // adjust offset to zoom toward cursor
      offsetRef.current.x =
        mouseX - ((mouseX - offsetRef.current.x) * newScale) / oldScale;

      offsetRef.current.y =
        mouseY - ((mouseY - offsetRef.current.y) * newScale) / oldScale;

      scaleRef.current = newScale;
    }

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mouseup", handleUp);
    canvas.addEventListener("mouseleave", handleUp);
    canvas.addEventListener("wheel", handleWheel);
    canvas.addEventListener("click", runFakeSearch);
    window.addEventListener("vector-search", async (e) => {
      const text = e.detail;
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3000/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text }),
        });
        const data = await res.json();
        console.log("Search results:", data);
      } catch (err) {
        console.error("Failed to search", err);
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(7,7,15,0.6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          {/* Spinner */}
          <div className="loader"></div>

          {/* Text */}
          <div style={{ color: "#aaa", marginTop: "10px" }}>
            Searching vectors...
          </div>
        </div>
      )}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: "#111",
            color: "#fff",
            padding: "4px 8px",
            fontSize: "12px",
            borderRadius: "4px",
            pointerEvents: "none",
          }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
