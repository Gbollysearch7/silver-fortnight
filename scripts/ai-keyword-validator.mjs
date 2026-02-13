#!/usr/bin/env node

/**
 * AI Keyword Validator
 *
 * Uses Claude to research and validate each keyword before content generation.
 * Determines:
 * 1. Is this about a competitor prop firm? (reject)
 * 2. Is this targeting traders getting funded? (approve)
 * 3. Is this targeting entrepreneurs/operators? (reject)
 *
 * Usage:
 *   node scripts/ai-keyword-validator.mjs --validate-all
 *   node scripts/ai-keyword-validator.mjs --validate-next 10
 *   node scripts/ai-keyword-validator.mjs --keyword "5ers prop firm"
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError } from '../lib/utils.mjs';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
});

const args = parseArgs();
const QUEUE_PATH = resolve(DATA_DIR, 'keyword-queue.json');
const VALIDATION_LOG_PATH = resolve(DATA_DIR, 'keyword-validation-log.json');

printHeader('AI Keyword Validator');
console.log('');

// Load keyword queue
function loadQueue() {
  try {
    const content = readFileSync(QUEUE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    printError(`Failed to load keyword queue: ${err.message}`);
    process.exit(1);
  }
}

// Save keyword queue
function saveQueue(data) {
  writeFileSync(QUEUE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Load validation log
function loadValidationLog() {
  try {
    const content = readFileSync(VALIDATION_LOG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { validations: [] };
  }
}

// Save validation log
function saveValidationLog(data) {
  writeFileSync(VALIDATION_LOG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// AI validation prompt
const VALIDATION_PROMPT = `You are a keyword validator for TradersYard, a proprietary trading firm that funds forex traders.

Your job is to determine if we should write a blog post about this keyword.

APPROVE if the keyword is about:
✅ Traders wanting to get funded
✅ Traders in prop firm challenges
✅ Traders evaluating which prop firm to join
✅ General prop firm education for traders
✅ Prop firm rules, strategies, tips for traders
✅ Comparisons of prop firm features (not specific brands)

REJECT if the keyword is about:
❌ A specific competitor prop firm (FTMO, The5ers, Funderpro, Fidelcrest, 5%ers, Fxify, Kortana, etc.)
❌ Entrepreneurs wanting to START a prop firm
❌ Prop firm owners/operators
❌ B2B services (white label, CRM, marketing)
❌ Legal/compliance professionals
❌ Investors
❌ Affiliates/partners

If the keyword mentions a brand name (like "5ers", "fxify", "funderpro", "kortana"), it should be REJECTED unless it's asking a generic question that applies to ALL prop firms.

Examples:
- "5ers prop firm review" → REJECT (specific brand review)
- "fxify prop firm rules" → REJECT (specific brand)
- "how to pass prop firm challenge" → APPROVE (generic, applies to all firms including TradersYard)
- "best prop firms for day traders" → APPROVE (comparison, can include TradersYard)
- "funderpro vs other prop firms" → REJECT (focused on competitor)
- "what is a consistency rule in prop firms" → APPROVE (educational, generic)
- "how to start a prop firm" → REJECT (entrepreneur focus)
- "kortana prop firm trustpilot" → REJECT (specific brand)

Respond in JSON format:
{
  "decision": "APPROVE" or "REJECT",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation",
  "brand_detected": null or "brand name if detected",
  "target_audience": "traders" or "entrepreneurs" or "operators" or "other"
}`;

// Validate a single keyword with AI
async function validateKeyword(keyword) {
  printInfo(`Validating: "${keyword}"`);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `${VALIDATION_PROMPT}\n\nKeyword to validate: "${keyword}"\n\nProvide your decision in JSON format.`,
        },
      ],
    });

    const text = response.content[0].text;

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Log result
    const symbol = result.decision === 'APPROVE' ? '✅' : '❌';
    const color = result.decision === 'APPROVE' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`  ${color}${symbol} ${result.decision}${reset} (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
    console.log(`  Reasoning: ${result.reasoning}`);
    if (result.brand_detected) {
      console.log(`  Brand detected: ${result.brand_detected}`);
    }
    console.log('');

    return result;

  } catch (err) {
    printError(`AI validation failed: ${err.message}`);
    return {
      decision: 'ERROR',
      confidence: 0,
      reasoning: err.message,
      brand_detected: null,
      target_audience: 'unknown',
    };
  }
}

// Main validation flow
async function validateKeywords(count = null) {
  const queueData = loadQueue();
  const validationLog = loadValidationLog();

  // Get keywords that need validation
  const toValidate = queueData.queue.filter(item => {
    return item.status === 'queued' && !item.ai_validated;
  });

  if (toValidate.length === 0) {
    printSuccess('All queued keywords are already validated!');
    return;
  }

  const total = count ? Math.min(count, toValidate.length) : toValidate.length;

  printSection(`Validating ${total} keywords`);
  console.log('');

  let approved = 0;
  let rejected = 0;
  let errors = 0;

  for (let i = 0; i < total; i++) {
    const item = toValidate[i];
    const keyword = item.keyword;

    console.log(`[${i + 1}/${total}]`);

    const result = await validateKeyword(keyword);

    // Update queue item
    item.ai_validated = true;
    item.ai_validation_result = result.decision;
    item.ai_validation_confidence = result.confidence;
    item.ai_validation_reasoning = result.reasoning;
    item.ai_brand_detected = result.brand_detected;
    item.ai_target_audience = result.target_audience;
    item.ai_validated_at = new Date().toISOString();

    // If rejected, mark as skipped
    if (result.decision === 'REJECT') {
      item.status = 'skipped';
      item.skip_reason = `AI rejected: ${result.reasoning}`;
      rejected++;
    } else if (result.decision === 'APPROVE') {
      approved++;
    } else {
      errors++;
    }

    // Log validation
    validationLog.validations.push({
      keyword,
      decision: result.decision,
      confidence: result.confidence,
      reasoning: result.reasoning,
      brand_detected: result.brand_detected,
      target_audience: result.target_audience,
      timestamp: new Date().toISOString(),
    });

    // Save after each validation
    saveQueue(queueData);
    saveValidationLog(validationLog);

    // Rate limit: wait 1 second between requests
    if (i < total - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('');
  printSection('Validation Summary');
  printSuccess(`✅ Approved: ${approved}`);
  printWarning(`❌ Rejected: ${rejected}`);
  if (errors > 0) {
    printError(`⚠️  Errors: ${errors}`);
  }
  console.log('');
  printInfo(`Validation log saved to: ${VALIDATION_LOG_PATH}`);
  console.log('');

  // Show rejected keywords
  if (rejected > 0) {
    printSection('Rejected Keywords');
    const rejectedItems = queueData.queue.filter(item => item.status === 'skipped' && item.ai_validation_result === 'REJECT');
    rejectedItems.forEach(item => {
      console.log(`  ❌ "${item.keyword}"`);
      console.log(`     Reason: ${item.ai_validation_reasoning}`);
      if (item.ai_brand_detected) {
        console.log(`     Brand: ${item.ai_brand_detected}`);
      }
      console.log('');
    });
  }
}

// Validate a single keyword (test mode)
async function validateSingleKeyword(keyword) {
  printSection(`Testing keyword validation`);
  console.log('');

  const result = await validateKeyword(keyword);

  console.log('Full result:');
  console.log(JSON.stringify(result, null, 2));
}

// Main execution
(async () => {
  try {
    if (args['keyword']) {
      // Test single keyword
      await validateSingleKeyword(args['keyword']);
    } else if (args['validate-all']) {
      // Validate all queued keywords
      await validateKeywords();
    } else if (args['validate-next']) {
      // Validate next N keywords
      const count = parseInt(args['validate-next']);
      if (isNaN(count) || count <= 0) {
        printError('--validate-next requires a positive number');
        process.exit(1);
      }
      await validateKeywords(count);
    } else {
      // Show help
      console.log('Usage:');
      console.log('  node scripts/ai-keyword-validator.mjs --validate-all');
      console.log('  node scripts/ai-keyword-validator.mjs --validate-next 10');
      console.log('  node scripts/ai-keyword-validator.mjs --keyword "5ers prop firm"');
      console.log('');
    }
  } catch (err) {
    printError(`Error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
})();
