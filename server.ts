import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// OpenAI DALL-E Proxy Route
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: "OpenAI API Key is missing on the server. Please add 'OPENAI_API_KEY' in the Settings menu." 
      });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A high-quality, trendy fashion photography shot. ${prompt}. Professional lighting, aesthetic composition.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    res.json({ url: response.data[0].url });
  } catch (error: any) {
    console.error("DALL-E Proxy Error:", error);
    
    // Fallback to Pollinations.ai if OpenAI fails due to billing or quota
    const isBillingError = error.message?.toLowerCase().includes('billing') || 
                          error.message?.toLowerCase().includes('hard limit') ||
                          error.status === 400 || 
                          error.status === 429;
    
    if (isBillingError) {
      console.warn("OpenAI Billing/Quota reached. Falling back to Pollinations.ai...");
      const pollinationsPrompt = encodeURIComponent(`professional fashion photography, high-end editorial look, ${req.body.prompt}, aesthetic, trendy, 8k resolution, highly detailed`);
      const seed = Math.floor(Math.random() * 1000000);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${pollinationsPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
      return res.json({ url: fallbackUrl, isFallback: true });
    }

    res.status(error.status || 500).json({ 
      error: error.message || "Failed to generate image with DALL-E." 
    });
  }
});

// Vite middleware for development

// API 404 Handler - Prevents falling back to HTML for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
