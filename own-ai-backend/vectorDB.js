import { getEmbedding } from "./ollama/embeddings.js";
class VectorDB {
  constructor() {
    this.data = [];
    this.idCounter = 0;
  }

  async insert(text) {
    const vector = await getEmbedding(text);
    const item = {
      id: this.idCounter++,
      text,
      vector,
    };
    this.data.push(item);
    return item;
  }

  getAll() {
    return this.data;
  }

  delete(id) {
    this.data = this.data.filter((item) => item.id !== id);
  }
}
export default VectorDB;
