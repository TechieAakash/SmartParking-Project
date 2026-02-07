const OpenAI = require("openai");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

async function testDirect() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const key = (process.env.OPENAI_API_KEY || "").trim();
    console.log(`Key length (trimmed): ${key.length}`);
    
    const models = ["gpt-4o-mini", "gpt-3.5-turbo", "gpt-4o"];
    
    for(const model of models) {
      console.log(`Testing model: ${model}...`);
      try {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: "Say 'hi'" }],
        });
        console.log(`✅ Model ${model} works: ${response.choices[0].message.content}`);
      } catch (err) {
        console.error(`❌ Model ${model} failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error("Direct OpenAI Error:", err.message);
  }
}

testDirect();
