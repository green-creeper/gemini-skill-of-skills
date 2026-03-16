---
name: skill-generator
description: Generate specialized Gemini CLI skills from documentation URLs. Use when you need to research a new library, framework, or API and want to package its documentation into a reusable skill.
---

# Skill Generator

## CRITICAL MANDATES (STRICT ENFORCEMENT)
- **WORKSPACE ROOT ONLY:** You MUST execute all commands from the user's current workspace root. Never use the `dir_path` parameter of `run_shell_command` to "cd" into the skill directory.
- **NO NESTING:** Never install a skill while your current directory is inside another skill's directory. 
- **ABSOLUTE TMP PATHS:** Always use `/Users/andrii/.gemini/tmp/skill-of-skill/<name>` as the crawl destination to ensure paths remain consistent across tool calls.
- **BOOTSTRAP ONCE:** Only run `npm install` if a "MODULE_NOT_FOUND" error occurs. Do not do it speculatively.

## Workflow

### 1. Identify the Generator Path
First, find where this generator is installed (usually `.gemini/skills/skill-generator` or `~/.gemini/skills/skill-generator`). Let's call this `<GEN_PATH>`.

### 2. Execution (The "One-Two Punch")
Run these commands from the workspace root. Do NOT wait for user feedback between them.

1. **Crawl**: `node <GEN_PATH>/scripts/crawl.cjs <url> <depth> /Users/andrii/.gemini/tmp/skill-of-skill/<name>`
2. **Scaffold**: `node <GEN_PATH>/scripts/scaffold.cjs <name> /Users/andrii/.gemini/tmp/skill-of-skill/<name> ./<name>-skill`

### 3. Installation
Install the skill from the workspace root:
`gemini skills install ./<name>-skill/<name>.skill --scope workspace --yes`

## Guidelines for Use

- **Recursive Depth**: Default is 2. Higher depth captures more detail but takes longer.
- **Scope**: The crawler is restricted to the same hostname to avoid wandering to external sites.
- **OpenAPI**: If a JSON URL is provided, it will attempt to convert the OpenAPI spec into a Markdown reference.

## Example Triggers

- "I want to learn about the 'cheerio' library. Here is the link: https://cheerio.js.org/. Create a skill for it."
- "Generate a skill for the OpenAI API using this spec: https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml"
- "Look through https://docs.nestjs.com/ and create a comprehensive NestJS skill."
