import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getDeepseek(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY || "missing",
      timeout: 60000,
    });
  }
  return _client;
}
