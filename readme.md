# Clash Royale Deck Fetcher

Dieses Node.js-Skript ermöglicht es, das zuletzt gespielte PvP-Deck eines Spielers über die Clash Royale API abzurufen. Du gibst einfach Clan-Namen (oder Clan-Tag) sowie den Ingame-Namen des Spielers an, und das Skript listet die acht zuletzt gespielten Karten.

## Voraussetzungen

- Node.js (LTS) installiert
- Git installiert
- Ein gültiger Clash Royale API-Key
- Internetzugriff für API-Requests

## Projektstruktur

```
├── index.js      # Hauptskript
├── README.md     # Diese Anleitung
├── .gitignore    # Ignorierte Dateien
└── package.json  # Projekt-Metadaten
```


## Abhängigkeiten installieren

```powershell
npm install @varandas/clash-royale-api
``` 

## Konfiguration

Lege deinen API-Key in der Umgebungsvariable ab (Windows PowerShell):

```powershell
setx CR_API_KEY "dein_api_key"
# danach PowerShell neu starten
```

## Nutzung

```powershell
node index.js 'ClanName' 'SpielerName'
```


Das Skript gibt dir dann das zuletzt gespielte Deck des Spielers aus.

