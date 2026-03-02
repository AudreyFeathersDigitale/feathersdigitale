import express from "express";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use("/api/", rateLimit({ windowMs: 60 * 1000, max: 30 }));

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

app.get("/health", (req, res) => res.type("text").send("OK"));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// debug: clé présente ? (sans l'afficher)
app.get("/api/debug", (req, res) => {
  const key = process.env.OPENAI_API_KEY || "";
  res.json({ hasKey: !!key, keyLength: key.length });
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message ?? "").trim();
    if (!message) return res.status(400).json({ error: "Message vide." });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Erreur serveur /api/chat",
        details: "OPENAI_API_KEY manquante dans .env",
        status: 500
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es l'assistant officiel du site Feather’s Digitale. Réponds clairement et brièvement sur services, offres, tarifs, contact. Si hors-sujet, redirige vers la page contact."
        },
        { role: "user", content: message }
      ],
      temperature: 0.6,
      max_tokens: 250
    });

    const reply = response?.choices?.[0]?.message?.content ?? "Je n’ai pas de réponse pour le moment.";
    res.json({ reply });

  } catch (err) {
    console.error("❌ /api/chat error:", err?.status, err?.message);

    res.status(err?.status || 500).json({
      error: "Erreur serveur /api/chat",
      details: err?.message || "Inconnue",
      status: err?.status || 500
    });
  }
});

app.listen(3000, () => {
  console.log("✅ Serveur lancé sur http://localhost:3000");
});