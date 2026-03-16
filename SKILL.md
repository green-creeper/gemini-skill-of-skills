---
name: skill-generator
description: Generate specialized Gemini CLI skills from documentation URLs. Use when you need to research a new library, framework, or API and want to package its documentation into a reusable skill.
---

# Skill Generator

## CRITICAL MANDATES (STOP AND READ)
- **NO PRE-RESEARCH:** Do NOT use `web_fetch`, `google_web_search`, or `codebase_investigator` to "research" the documentation or the generator itself. The generator IS the research tool.
- **NO EXPLORATION:** Do NOT use `ReadFolder` or `ReadFile` on the generator's internal scripts or `node_modules`. Assume they are broken/missing and just run `npm install` first.
- **ROOT EXECUTION:** ALWAYS execute all commands from the **workspace root**. Never `cd` into the skill directory.
- **ABSOLUTE PATHS:** Use absolute paths for the temporary directory to avoid confusion during context shifts.

## Workflow

### 1. Bootstrap (Mandatory First Step)
Before doing anything else, ensure dependencies are installed in the generator's directory:
`npm install --prefix <path_to_generator>`

### 2. Execution (The "One-Two Punch")
Run these two commands sequentially. Do NOT wait for user feedback between them. Use `/Users/andrii/.gemini/tmp/skill-of-skill/<name>` as the absolute temp path.

1. **Crawl**: `node <path_to_generator>/scripts/crawl.cjs <url> <depth> /Users/andrii/.gemini/tmp/skill-of-skill/<name>`
2. **Scaffold**: `node <path_to_generator>/scripts/scaffold.cjs <name> /Users/andrii/.gemini/tmp/skill-of-skill/<name> ./<name>-skill`

### 3. Efficiency & Autonomy
- **Trust the Tools:** Do not spend turns verifying if files were created. If the command exits with code 0, move to the next step.
- **No Speculative Fetching:** Trust the crawler. If it visits 0 pages, only then investigate.

### 4. Installation
Install the skill using the `--yes` flag to avoid interactive prompts:
`gemini skills install ./<name>-skill/<name>.skill --scope workspace --yes`

## Guidelines for Use

- **Recursive Depth**: Default is 2. Higher depth captures more detail but takes longer.
- **Scope**: The crawler is restricted to the same hostname to avoid wandering to external sites.
- **OpenAPI**: If a JSON URL is provided, it will attempt to convert the OpenAPI spec into a Markdown reference.

## Example Triggers

- "I want to learn about the 'cheerio' library. Here is the link: https://cheerio.js.org/. Create a skill for it."
- "Generate a skill for the OpenAI API using this spec: https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml"
- "Look through https://docs.nestjs.com/ and create a comprehensive NestJS skill."
