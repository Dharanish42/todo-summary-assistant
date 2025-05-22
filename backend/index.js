require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const axios = require("axios");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/todos
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/todos error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/todos
app.post("/api/todos", async (req, res) => {
  try {
    console.log("Incoming body:", req.body);
    const { text } = req.body;
    const result = await pool.query(
      "INSERT INTO todos (text) VALUES ($1) RETURNING *",
      [text]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST /api/todos error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE todo by ID
app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM todos WHERE id = $1", [id]);
  res.json({ message: "Deleted" });
});

// SUMMARIZE and send to Slack
app.post("/api/summarize", async (req, res) => {
  const todosResult = await pool.query("SELECT text FROM todos");
  const todos = todosResult.rows.map((row) => row.text).join("\n- ");

  const prompt = `Summarize the following todo list in a helpful, concise paragraph:\n\n- ${todos}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = completion.choices[0].message.content;

    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `📝 *Todo Summary:*\n${summary}`,
    });

    res.json({ message: "Summary sent to Slack", summary });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to summarize and send to Slack" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
