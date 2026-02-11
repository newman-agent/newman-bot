<div align="center">

# Newman Bot

### Advanced Discord Bot for Fact-Checking, AI Chat & Image Analysis

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.14-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15-orange.svg)](https://pnpm.io/)

</div>

---

## About

Newman Bot is a Discord bot focused on combating disinformation through artificial intelligence and real-time web search. Built with Clean Architecture and SOLID principles, it provides intelligent fact-checking, natural conversation, and image analysis capabilities.

**Created by [Lucas Henry](https://github.com/lucashenry)**

---

## Key Features

- **AI-Powered Chat** - Natural conversation with context memory and multi-turn dialogue support
- **Fact-Checking** - Verifies claims using multiple sources with credibility analysis and confidence scoring
- **Image Analysis** - Detailed visual content description, OCR, and meme analysis via Llama 4 Scout
- **Web Search** - Real-time information retrieval with Brave Search and DuckDuckGo integration
- **Multi-language** - Full support for Portuguese, English, and Spanish

---

## Commands

Default prefix: `!` (configurable)

| Command | Description | Aliases |
|---------|-------------|---------|
| `!chat <message>` | Natural AI conversation with image support | `!c`, `!conversar` |
| `!analyze [question]` | Analyze images in detail | `!analisar`, `!img`, `!image` |
| `!search <query>` | Search the web with AI synthesis | `!buscar`, `!s` |
| `!verify <claim>` | Fact-check claims with sources | `!verificar`, `!check`, `!v` |
| `!help` | Show all commands | `!ajuda`, `!h`, `!?` |

---

## Tech Stack

**Core:** NestJS, TypeScript, Discord.js v14, pnpm  
**AI:** Groq API (Llama 3.1 8B), Llama 4 Scout (vision)  
**Search:** Brave Search API, DuckDuckGo  

**Architecture:** Clean Architecture with Domain-Driven Design, SOLID principles, and Dependency Injection

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/newman-agent/newman-bot.git
cd newman-bot

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Add your DISCORD_TOKEN and LLM_API_KEY

# Run
pnpm run start:dev
```

**Requirements:** Node.js 18+, Discord Bot Token, Groq API Key

---

## Support

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-orange?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/henrylucasx)

Your contribution helps maintain the project and cover API costs.

</div>

---

## License

MIT License - Copyright (c) 2024 Lucas Henry

---

## Contact

**Lucas Henry**  
GitHub: [@lucashenry](https://github.com/lucashenry) | Discord: @lucashenry | [Buy Me a Coffee](https://buymeacoffee.com/henrylucasx)

**Project Links**  
[Repository](https://github.com/newman-agent/newman-bot) | [Issues](https://github.com/newman-agent/newman-bot/issues)

---

<div align="center">

Made with dedication by [Lucas Henry](https://github.com/lucashenry)

</div>
