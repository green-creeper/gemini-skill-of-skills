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
The skill uses internal scripts to process the documentation. To ensure smooth execution, ALWAYS run these from the project root:
- **Crawl**: `node scripts/crawl.cjs <url> <depth> ./tmp/<name>`
- **Scaffold**: `node scripts/scaffold.cjs <name> ./tmp/<name> ./<name>-skill`

### 3. Efficiency & Autonomy (Strict)
To maintain context efficiency and speed, follow these mandates:
- **No Pre-Exploration:** Do not use `ReadFolder` or `ReadFile` on the generator's internal scripts or `node_modules` before starting. Assume they are ready.
- **Sequential Execution:** Run the `Crawl` and `Scaffold` commands immediately. Do not wait for user confirmation between these steps unless an error occurs.
- **Trust the Cleaning:** The scripts handle most clutter. Do not spend turns reading every generated file to verify quality. Perform a single `ls` check at the end to verify the skill was created.
- **No Speculative Fetching:** Do not use `web_fetch` to "investigate" the documentation site or verify links. Trust the crawler's output.

### 4. Refinement
If the documentation is particularly messy, you may perform a surgical cleanup of the `references/` directory.
- **Identify and remove** remaining "meaningless data" such as cookie banners or navigation fragments.
- **Surgically clean** files only if they significantly degrade the quality of information.

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
