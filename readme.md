# Clash Royale Deck Fetcher

This Node.js script allows you to fetch the last played PvP deck of a player via the Clash Royale API. Simply provide the clan name (or clan tag) and the player's in-game name, and the script will display the eight cards the player used in their most recent match.

## Prerequisites

- Node.js (LTS) installed
- Git installed
- A valid Clash Royale API key

## Project Structure

```
├── index.js      # Main script
├── README.md     # This guide
├── .gitignore    # Ignored files
└── package.json  # Project metadata
```

## Installation

Install the required dependency:

```bash
npm install @varandas/clash-royale-api
```

## Configuration

Set your API key in an environment variable (Windows PowerShell):

```powershell
setx CR_API_KEY "your_api_key_here"
# Restart PowerShell after setting the variable
```

## Usage

Run the script in the project folder:

```bash
node index.js 'ClanName' 'PlayerName'
```

Examples:

```bash
node index.js wien chrisitrisi
node index.js "#990R0VL8" polo077
```

The script will output the eight cards from the player's most recent PvP deck.
