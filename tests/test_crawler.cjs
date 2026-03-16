#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CRAWL_SCRIPT = path.join(__dirname, '../skill-generator/scripts/crawl.cjs');
const OUTPUT_DIR = path.join(__dirname, 'test_output');
const TARGET_URL = 'https://www.json.org/json-en.html';

console.log('--- Testing Crawler ---');
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true });
}

const crawlProcess = spawnSync('node', [CRAWL_SCRIPT, TARGET_URL, '0', OUTPUT_DIR], { stdio: 'inherit' });

if (crawlProcess.status !== 0) {
  console.error('Crawler failed');
  process.exit(1);
}

const files = fs.readdirSync(OUTPUT_DIR);
console.log(`Files generated: ${files.length}`);

if (files.length === 0) {
  console.error('No files generated');
  process.exit(1);
}

const content = fs.readFileSync(path.join(OUTPUT_DIR, files[0]), 'utf8');
if (content.includes('# ') && content.includes('Source: ' + TARGET_URL)) {
  console.log('✅ Crawler basic validation passed');
} else {
  console.error('❌ Crawler validation failed: Missing title or source');
  console.log('Content preview:', content.substring(0, 200));
  process.exit(1);
}
