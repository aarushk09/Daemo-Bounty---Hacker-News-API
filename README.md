# Daemo-Bounty - Hacker News API Agent

Aarush K's submission for the Daemo Bounty (Hacker News API).

This project implements an AI agent using the Daemo SDK to curate tech news.

## Project Structure

```
.
├── src/
│   ├── services/
│   │   └── MyFunctions.ts    # Contains Daemo tools/functions (Hacker News integration)
│   ├── env.example           # Template for environment variables
│   └── index.ts              # Entry point connecting to Daemo
├── package.json
└── README.md
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory based on the template in `src/env.example`.
   
   ```bash
   # Copy template to root .env
   cp src/env.example .env
   ```
   
   Then edit `.env` and add your Daemo API Key:
   ```
   DAEMO_AGENT_API_KEY=daemo_live_...
   ```

3. **Run the agent:**
   ```bash
   npm start
   ```
