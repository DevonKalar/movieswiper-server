import OpenAI from 'openai';
import config from './src/config/env.js';

const client = new OpenAI({
    apiKey: config.apiKeys.openai,
});

console.log('Using OpenAI API Key:', config.apiKeys.openai);

const response = await client.responses.create({
    model: 'gpt-4o',
    input: 'Write a one-sentence bedtime story about a unicorn.',
    max_output_tokens: 100,
});

console.log(response.output_text);
