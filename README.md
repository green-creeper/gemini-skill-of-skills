# Skill Generator for Gemini CLI

The **Skill Generator** is a specialized meta-skill for `gemini-cli` that allows you to autonomously research any technology and package it into a reusable Gemini CLI skill. 

By providing a documentation URL, the generator recursively crawls the site, extracts high-signal content, converts it to clean Markdown, and creates a packaged `.skill` file ready for installation.

## 🚀 Key Features

- **Recursive Crawler**: Efficiently navigates documentation sites while respecting domain boundaries.
- **Heuristic Extraction**: Strips navigation bars, footers, and ads to extract only the core technical content.
- **Polyglot Scripting**: Can be used to research and generate skills for any library or framework (Python, Node.js, Go, etc.).
- **Auto-Scaffolding**: Automates the creation of `SKILL.md`, `references/`, and the final packaging process.
- **Self-Refinement**: Includes built-in instructions for the agent to clean up and audit crawled data before finalization.

## 📦 Installation

To use this generator as a skill in your workspace:

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Package it into a `.skill` file if you want to share it:
   ```bash
   node scripts/scaffold.cjs skill-generator ./references .
   ```
4. Install it to your Gemini CLI:
   ```bash
   gemini skills install ./skill-generator.skill --scope workspace
   ```

## 🛠 Usage

Once installed, you can trigger the generator by asking Gemini CLI:

> "I want to research the 'sentinelhub-py' library at https://sentinelhub-py.readthedocs.io/ and create a skill for it."

The agent will then:
1. **Crawl**: Fetch all relevant pages.
2. **Refine**: Review and clean the content.
3. **Scaffold**: Build the new skill structure.
4. **Package**: Create the `.skill` file for you to install.

## 📂 Project Structure

- `scripts/crawl.cjs`: The recursive crawling engine.
- `scripts/scaffold.cjs`: Automates skill creation and packaging.
- `SKILL.md`: Instructions for Gemini CLI on how to use this generator.
- `tests/`: Basic validation scripts.

## 📄 License

Apache-2.0
