async function generateAnswer(context, question) {
  const prompt = `
You are an AI assistant. Answer ONLY from the provided context.

Context:
${context}

Question:
${question}

Answer:
`;

  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: prompt,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.response;
}
export { generateAnswer };
