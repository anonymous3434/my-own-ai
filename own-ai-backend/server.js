import express from "express";
import cors from "cors";
import { getEmbedding } from "./ollama/embeddings.js";
import { generateAnswer } from "./ollama/llmModel.js";
import VectorDB from "./vectorDB.js";
import { searchBruteForce } from "./helper.js";

const app = express();
app.use(cors());
app.use(express.json());

const db = new VectorDB();

//get all items in the database
app.get("/items", async (req, res) => {
  res.json(db.getAll());
});

// ➤ Insert
app.post("/insert", async (req, res) => {
  const { text } = req.body;

  const vector = await getEmbedding(text);
  db.insert(text, vector);

  res.json({ message: "Inserted" });
});

// ➤ Search
app.post("/search", async (req, res) => {
  const { query, k } = req.body;

  const vector = await getEmbedding(query);
  const results = searchBruteForce(vector, 3, db);
  res.json(results);
});

// ➤ Ask (RAG)
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  const queryVector = await getEmbedding(question);
  const results = searchBruteForce(queryVector, 3, db);

  const context = results.map((r) => r.text).join("\n");
  const answer = await generateAnswer(context, question);

  res.json({ answer, context: results });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
