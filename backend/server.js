import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import translate from "translate-google"; // ONLY this

const app = express();
app.use(cors());
app.use(express.json());

/*  MONGODB  */
mongoose.connect("mongodb://127.0.0.1:27017/fluentra");

/*  SCHEMA */
const HistorySchema = new mongoose.Schema({
  sourceText: String,
  translatedText: String,
  createdAt: { type: Date, default: Date.now }
});

const History = mongoose.model("History", HistorySchema);

/*  TRANSLATE  */
app.post("/translate", async (req, res) => {
  const { text, target } = req.body;

  if (!text || !target) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    let result;

    // try once
    try {
      result = await translate(text, { to: target });
    } catch {
      console.log("Retrying...");
      result = await translate(text, { to: target });
    }

    await History.create({
      sourceText: text,
      translatedText: result
    });

    res.json({ translatedText: result });

  } catch (err) {
    console.log("FINAL ERROR:", err.message);

    res.json({
      translatedText: "⚠️ Translation temporarily unavailable"
    });
  }
});

/*  HISTORY  */
app.get("/history", async (req, res) => {
  const data = await History.find().sort({ createdAt: -1 });
  res.json(data);
});

app.delete("/history/:id", async (req, res) => {
  await History.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.delete("/history", async (req, res) => {
  await History.deleteMany();
  res.json({ success: true });
});

/*  START  */
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});