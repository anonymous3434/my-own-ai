import { getEmbedding } from "./ollama/embeddings.js";
import { generateAnswer } from "./ollama/llmModel.js";

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  return dotProduct / (normA * normB);
}

export function searchBruteForce(queryVector, k, db) {
  //O(N) where N is the number of items in the database
  const results = db.getAll().map((item) => {
    const similarity = cosineSimilarity(queryVector, item.vector);
    return { ...item, similarity };
  });
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, k);
}
export async function askQuestion(db, question) {
  const questionVector = await getEmbedding(question);
  const relevantItems = searchBruteForce(questionVector, 3, db);
  const context = relevantItems.map((item) => item.text).join("\n");
  const answer = await generateAnswer(context, question);
  return { answer, contextUsed: relevantItems };
}
