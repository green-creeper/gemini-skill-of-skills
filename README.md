# Skill Generator for Gemini CLI

The **Skill Generator** is a specialized meta-skill for `gemini-cli` that allows you to autonomously research any technology and package it into a reusable Gemini CLI skill. 

By providing a documentation URL, the generator recursively crawls the site, extracts high-signal content, converts it to clean Markdown, and creates a packaged `.skill` file ready for installation.

## 🚀 Key Features

- **Recursive Crawler**: Efficiently navigates documentation sites while respecting domain boundaries.
- **Improved Heuristic Extraction**: Automatically strips navigation bars, sidebars, footers, and ads. Specialized for ReadTheDocs, Sphinx, Gitbook, and Docusaurus.
- **Double-Title Prevention**: Intelligently handles H1 headers to avoid redundant titles in Markdown.
- **Portable Scaffolding**: Improved discovery of `gemini-cli` system tools across different environments.
- **Auto-Scaffolding**: Automates the creation of `SKILL.md`, `references/`, and the final packaging process.

## 📦 Installation

To install this generator directly from GitHub into your **user scope** (available globally):

```bash
gemini skills install https://github.com/green-creeper/gemini-skill-of-skills.git
```

Alternatively, to install it for a specific **workspace scope**:

```bash
gemini skills install https://github.com/green-creeper/gemini-skill-of-skills.git --scope workspace
```

### Manual Installation (Development)

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Package it into a `.skill` file if you want to share it:
   ```bash
   node scripts/scaffold.cjs skill-generator ./references .
   ```
4. Install the local package:
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
