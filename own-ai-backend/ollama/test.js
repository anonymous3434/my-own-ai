import { getEmbedding } from "./embeddings.js";

const run = async () => {
  const a = await getEmbedding("Apple");
  const b = await getEmbedding("Grapes");

  console.log("A === B ?", JSON.stringify(a) === JSON.stringify(b));
};

run();
