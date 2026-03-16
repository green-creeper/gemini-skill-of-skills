#!/usr/bin/env node

/**
 * Recursive Documentation Crawler for Gemini CLI Skill Generator
 * 
 * Usage:
 *   node crawl.cjs <url> [max_depth] [output_dir]
 */

const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const pLimit = require('p-limit');

// Initialize Turndown with some basic rules
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Preserve code block language if available
turndownService.addRule('fencedCodeBlock', {
  filter: ['pre'],
  replacement: function (content, node) {
    const codeElement = node.querySelector('code');
    const language = codeElement ? (codeElement.className.match(/language-(\S+)/) || [])[1] : '';
    return '\n\n```' + (language || '') + '\n' + content.trim() + '\n```\n\n';
  }
});

const visited = new Set();
const limit = pLimit(3); // Limit concurrency to 3 requests

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

async function crawl(targetUrl, maxDepth = 2, outputDir = './output', currentDepth = 0) {
  const urlObj = new URL(targetUrl);
  const normalizedUrl = urlObj.origin + urlObj.pathname.replace(/\/$/, '');

  if (visited.has(normalizedUrl) || currentDepth > maxDepth) {
    return;
  }

  visited.add(normalizedUrl);
  console.log(`[Depth ${currentDepth}] Crawling: ${normalizedUrl}`);

  try {
    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (GeminiCLI-SkillGenerator/1.0)' },
      timeout: 10000
    });

    const contentType = response.headers['content-type'] || '';
    let markdown = '';
    let title = 'untitled';

    if (contentType.includes('application/json') || targetUrl.endsWith('.json')) {
      // Basic OpenAPI/JSON to Markdown conversion
      markdown = `# API Reference: ${targetUrl}\n\n\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\``;
      title = targetUrl.split('/').pop().replace('.json', '');
    } else if (contentType.includes('text/html')) {
      const $ = cheerio.load(response.data);
      title = $('title').text().trim() || 'page';
      
      // Target common documentation content areas
      const contentSelectors = ['main', 'article', '.content', '#content', '.documentation', '.docs-content', 'body'];
      let contentHtml = '';
      for (const selector of contentSelectors) {
        const el = $(selector);
        if (el.length > 0) {
          // Clone to avoid modifying the original if we need to try another selector
          const clone = el.clone();
          // Strip noise
          clone.find('nav, footer, script, style, .sidebar, .ads, header').remove();
          contentHtml = clone.html();
          if (contentHtml && contentHtml.length > 200) break; // Heuristic: valid content usually > 200 chars
        }
      }

      markdown = turndownService.turndown(contentHtml || response.data);
      markdown = `# ${title}\n\nSource: ${targetUrl}\n\n${markdown}`;

      // Find more links to follow
      if (currentDepth < maxDepth) {
        const links = [];
        $('a[href]').each((_, el) => {
          try {
            const href = $(el).attr('href');
            const absoluteUrl = new URL(href, targetUrl);
            // Only crawl same origin and same base path (usually docs are under a subpath)
            if (absoluteUrl.origin === urlObj.origin && !absoluteUrl.hash) {
                links.push(absoluteUrl.href);
            }
          } catch (e) { /* ignore invalid URLs */ }
        });

        // Parallel crawl with limit
        await Promise.all(links.map(link => limit(() => crawl(link, maxDepth, outputDir, currentDepth + 1))));
      }
    }

    // Save output
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
    const fileName = `${safeTitle}_${Math.random().toString(36).substring(7)}.md`;
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, fileName), markdown);

  } catch (err) {
    console.error(`Failed to crawl ${targetUrl}: ${err.message}`);
  }
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node crawl.cjs <url> [max_depth] [output_dir]');
    process.exit(1);
  }

  const startUrl = args[0];
  const depth = args[1] !== undefined ? parseInt(args[1]) : 2;
  const out = args[2] || './output';

  try {
    await crawl(startUrl, depth, out);
    console.log(`Crawl complete. Visited ${visited.size} pages.`);
  } catch (err) {
    console.error(`Crawl failed: ${err.message}`);
    process.exit(1);
  }
}

run();
