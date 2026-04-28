export async function getEmbedding(text) {
  console.log("🔥 Sending to Ollama:", text);

  try {
    const response = await fetch("http://127.0.0.1:11434/api/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "all-minilm",
        prompt: text,
      }),
    });

    const data = await response.json();

    if (!data.embedding) {
      console.error("❌ No embedding returned:", data);
      return null;
    }

    console.log("✅ Received vector (first 5):", data.embedding.slice(0, 5));

    return data.embedding;
  } catch (err) {
    console.error("❌ Embedding error:", err);
    return null;
  }
}
