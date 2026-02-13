#!/usr/bin/env node

/**
 * AI Content Generator Test Script
 *
 * Quick test to verify Claude and OpenAI integration works.
 * Compares both providers for a simple article generation task.
 */

import { generateContent, compareProviders, estimateCost, PRICING } from '../lib/ai-content-generator.mjs';

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🤖 AI Content Generator Test Suite              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

// Simple test prompt
const testPrompt = `Write a 300-word introduction to proprietary trading for beginners.

Requirements:
- Explain what prop trading is
- Mention funded accounts
- Use simple, beginner-friendly language
- Include a clear example

Start with "# What is Proprietary Trading?"`;

console.log('📝 Test Prompt:');
console.log('─'.repeat(60));
console.log(testPrompt);
console.log('─'.repeat(60));

// Show pricing
console.log('\n💰 Pricing:');
console.log(`   Claude (${PRICING.claude.model}):`);
console.log(`      Input:  $${PRICING.claude.input}/1K tokens`);
console.log(`      Output: $${PRICING.claude.output}/1K tokens`);
console.log(`   OpenAI (${PRICING.openai.model}):`);
console.log(`      Input:  $${PRICING.openai.input}/1K tokens`);
console.log(`      Output: $${PRICING.openai.output}/1K tokens`);

// Estimate costs
const claudeEst = estimateCost(300, 'claude');
const openaiEst = estimateCost(300, 'openai');

console.log('\n📊 Estimated Cost (300 words):');
console.log(`   Claude: $${claudeEst.cost.toFixed(4)}`);
console.log(`   OpenAI: $${openaiEst.cost.toFixed(4)}`);

// Run comparison
console.log('\n🚀 Starting comparison test...\n');

try {
  const results = await compareProviders(testPrompt, 500);

  // Show content preview
  console.log('\n📄 Content Previews:');
  console.log('═'.repeat(70));

  for (const [provider, result] of Object.entries(results)) {
    if (result.error) continue;

    console.log(`\n${provider.toUpperCase()} Output (first 200 chars):`);
    console.log('─'.repeat(70));
    console.log(result.content.substring(0, 200) + '...');
    console.log('─'.repeat(70));
  }

  console.log('\n✅ Test completed successfully!\n');
  console.log('💡 Both AI providers are working correctly.');
  console.log('   You can now use either Claude or OpenAI for content generation.');
  console.log('\n   Examples:');
  console.log('   - npm run generate -- --topic "Test" --keyword "test" --provider claude');
  console.log('   - npm run generate -- --topic "Test" --keyword "test" --provider openai');
  console.log('   - npm run generate -- --topic "Test" --keyword "test" --compare');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error('\n   Please check your API keys in .env:');
  console.error('   - CLAUDE_API_KEY');
  console.error('   - OPENAI_API_KEY');
  process.exit(1);
}
