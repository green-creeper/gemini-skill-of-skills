#!/usr/bin/env node

/**
 * Skill Scaffolder for Gemini CLI
 * 
 * Takes a directory of Markdown files and turns them into a packaged .skill file.
 * 
 * Usage:
 *   node scaffold.cjs <skill_name> <input_docs_dir> [output_skill_dir]
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Attempt to find system tools dynamically
const findSystemTool = (toolName) => {
  const possiblePaths = [];

  try {
    const gPath = execSync('which gemini', { encoding: 'utf8' }).trim();
    if (gPath) {
      // If gemini is a symlink (like in /usr/local/bin), follow it to find its true location
      const realPath = fs.realpathSync(gPath);
      // Usually, gemini is in /path/to/node_modules/@google/gemini-cli/dist/src/index.js
      // or similar. We want to find the root of the package.
      let current = realPath;
      while (current !== path.dirname(current)) {
        if (fs.existsSync(path.join(current, 'package.json'))) {
          const pkg = JSON.parse(fs.readFileSync(path.join(current, 'package.json'), 'utf8'));
          if (pkg.name === '@google/gemini-cli') {
            possiblePaths.push(path.join(current, 'node_modules/@google/gemini-cli-core/dist/src/skills/builtin/skill-creator/scripts', toolName));
            possiblePaths.push(path.join(current, 'dist/src/skills/builtin/skill-creator/scripts', toolName));
            break;
          }
        }
        current = path.dirname(current);
      }
    }
  } catch (e) {}

  try {
    const lRoot = execSync('npm root', { encoding: 'utf8' }).trim();
    possiblePaths.push(path.join(lRoot, '@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/skills/builtin/skill-creator/scripts', toolName));
  } catch (e) {}

  // Common user paths (macOS/Linux)
  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    possiblePaths.push(path.join(home, '.nvm/versions/node/*/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/skills/builtin/skill-creator/scripts', toolName));
  }

  for (const p of possiblePaths) {
    // Handle glob-like patterns manually or just direct check
    if (p.includes('*')) {
      try {
        const parentDir = path.dirname(p.split('*')[0]);
        if (fs.existsSync(parentDir)) {
          const matched = execSync(`ls ${p} 2>/dev/null`, { encoding: 'utf8' }).split('\n')[0].trim();
          if (matched && fs.existsSync(matched)) return matched;
        }
      } catch (e) {}
    } else if (fs.existsSync(p)) {
      return p;
    }
  }
  
  return null;
};

const INIT_SKILL_PATH = findSystemTool('init_skill.cjs');
const PACKAGE_SKILL_PATH = findSystemTool('package_skill.cjs');

if (!INIT_SKILL_PATH || !PACKAGE_SKILL_PATH) {
  console.error('❌ Error: Could not find gemini-cli skill-creator scripts.');
  console.error('Please ensure gemini-cli is installed globally or update the paths in scripts/scaffold.cjs');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scaffold.cjs <skill_name> <input_docs_dir> [output_skill_dir]');
    process.exit(1);
  }

  const skillName = args[0];
  const inputDocsDir = path.resolve(args[1]);
  const outputSkillDir = args[2] ? path.resolve(args[2]) : process.cwd();

  if (!fs.existsSync(inputDocsDir)) {
    console.error(`Error: Input directory does not exist: ${inputDocsDir}`);
    process.exit(1);
  }

  console.log(`🚀 Scaffolding skill: ${skillName}`);

  try {
    // 1. Initialize the skill structure
    console.log('--- Initializing skill structure ---');
    execSync(`node "${INIT_SKILL_PATH}" ${skillName} --path "${outputSkillDir}"`, { stdio: 'inherit' });

    const skillPath = path.join(outputSkillDir, skillName);
    const referencesDir = path.join(skillPath, 'references');
    const scriptsDir = path.join(skillPath, 'scripts');
    const assetsDir = path.join(skillPath, 'assets');

    // 2. Clear example files
    [referencesDir, scriptsDir, assetsDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          fs.unlinkSync(path.join(dir, file));
        });
      }
    });

    const docs = fs.readdirSync(inputDocsDir).filter(f => f.endsWith('.md'));
    console.log(`--- Moving ${docs.length} documents to references/ ---`);
    
    let indexContent = `# Documentation Index for ${skillName}\n\n`;

    docs.forEach(doc => {
      const src = path.join(inputDocsDir, doc);
      const dest = path.join(referencesDir, doc);
      fs.copyFileSync(src, dest);
      
      // Extract title from the first line if it's an H1
      const firstLine = fs.readFileSync(src, 'utf8').split('\n')[0];
      const title = firstLine.startsWith('# ') ? firstLine.substring(2).trim() : doc;
      indexContent += `- [${title}](./${doc})\n`;
    });

    // 3. Generate INDEX.md
    fs.writeFileSync(path.join(referencesDir, 'INDEX.md'), indexContent);
    console.log('✅ Generated references/INDEX.md');

    // 4. Update SKILL.md with a clean version
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    const skillTitle = skillName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const cleanSkillMd = `---
name: ${skillName}
description: Expertise and documentation for ${skillName}. Use when you need to answer questions about ${skillName} or write code using its APIs.
---

# ${skillTitle}

## Overview

This skill provides comprehensive documentation and context for working with ${skillName}, generated from its online documentation.

## References

See [INDEX.md](references/INDEX.md) for a full list of available documentation.
`;
    fs.writeFileSync(skillMdPath, cleanSkillMd);
    console.log('✅ Generated clean SKILL.md');

    // 5. Package the skill
    console.log('--- Packaging skill ---');
    execSync(`node "${PACKAGE_SKILL_PATH}" "${skillPath}" "${outputSkillDir}"`, { stdio: 'inherit' });

    console.log(`\n🎉 Success! Skill packaged at: ${path.join(outputSkillDir, skillName + '.skill')}`);
    console.log(`Install it with: gemini skills install ${path.join(outputSkillDir, skillName + '.skill')} --scope workspace`);

  } catch (err) {
    console.error(`❌ Scaffolding failed: ${err.message}`);
    process.exit(1);
  }
}

main();
