---
name: skill-generator
description: Generate specialized Gemini CLI skills from documentation URLs. Use when you need to research a new library, framework, or API and want to package its documentation into a reusable skill.
---

# Skill Generator

## Overview

This skill allows you to autonomously research any technology by providing a URL. It recursively crawls the documentation, converts it to clean Markdown, organizes it into a structured reference base, and packages it into a new Gemini CLI skill (`.skill` file).

## Workflow

### 1. Discovery & Input
Provide one or more URLs and an optional depth (default is 2).
Example: "Research the documentation at https://axios-http.com/docs/intro and create a skill for it."

### 2. Execution
The skill uses internal scripts to process the documentation:
- **Crawl**: `node scripts/crawl.cjs <url> <depth> <temp_dir>`
- **Scaffold**: `node scripts/scaffold.cjs <skill_name> <temp_dir> <output_dir>`

### 3. Refinement (Crucial)
After scaffolding, the agent MUST review the Markdown files in the newly created `<skill_name>/references/` directory. 
- **Identify and remove** any "meaningless data" or "scrapping artifacts" such as:
    - Leftover navigation menus or footer links.
    - "Sign in" or "Log in" prompts.
    - Cookie consent banners or privacy policy fragments.
    - Language selectors (e.g., "[English] [中文] [Deutsch]").
- **Surgically clean** the files to ensure only high-signal documentation remains.

### 4. Review & Install
After refinement, provide a summary of the cleaned content and the path to the `.skill` file.
You can then install it using:
`gemini skills install ./<skill_name>.skill --scope workspace`

## Guidelines for Use

- **Recursive Depth**: Default is 2. Higher depth captures more detail but takes longer.
- **Scope**: The crawler is restricted to the same hostname to avoid wandering to external sites.
- **OpenAPI**: If a JSON URL is provided, it will attempt to convert the OpenAPI spec into a Markdown reference.

## Example Triggers

- "I want to learn about the 'cheerio' library. Here is the link: https://cheerio.js.org/. Create a skill for it."
- "Generate a skill for the OpenAI API using this spec: https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml"
- "Look through https://docs.nestjs.com/ and create a comprehensive NestJS skill."
