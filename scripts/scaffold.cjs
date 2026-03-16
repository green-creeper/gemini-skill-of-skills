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

// Attempt to find system tools dynamically or use defaults
const findSystemTool = (toolName) => {
  try {
    // Check common locations or use 'npm root -g' logic
    const gRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const tool = path.join(gRoot, '@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/skills/builtin/skill-creator/scripts', toolName);
    if (fs.existsSync(tool)) return tool;
  } catch (e) {}
  
  // Fallback to the hardcoded path from development environment
  const fallback = path.join('/Users/andrii/.nvm/versions/node/v25.2.1/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/skills/builtin/skill-creator/scripts', toolName);
  if (fs.existsSync(fallback)) return fallback;
  
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
