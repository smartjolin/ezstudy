import OpenAI from "openai";

export const deepseek = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
  timeout: 60000, // 60s timeout for long generation requests
});
