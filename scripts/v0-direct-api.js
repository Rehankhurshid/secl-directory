#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function callV0API(prompt) {
  const apiKey = process.env.V0_API_KEY;
  if (!apiKey) {
    throw new Error('V0_API_KEY not found in environment variables');
  }

  console.log('🚀 Calling V0 API...');

  const response = await fetch('https://api.v0.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'v0-1.5-lg',
      messages: [
        {
          role: 'system',
          content: 'You are an expert UI/UX designer specializing in React, Next.js, TypeScript, and Tailwind CSS. Generate complete, production-ready components with beautiful modern designs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  try {
    // Read the prompt file
    const promptPath = path.join(__dirname, '../v0-prompts/rebuild-existing-messaging.md');
    const prompt = await fs.readFile(promptPath, 'utf-8');

    // Call V0 API
    const result = await callV0API(prompt);

    // Save the result
    const outputPath = path.join(__dirname, '../v0-output/messaging-redesign-complete.tsx');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, result);

    console.log('✅ V0 API call successful!');
    console.log(`📁 Output saved to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();