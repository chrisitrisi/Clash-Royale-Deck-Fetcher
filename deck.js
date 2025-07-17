// index.js
// Node.js-Skript zur Abfrage des zuletzt gespielten PvP-Decks eines Spielers via @varandas/clash-royale-api

const { ClashRoyaleAPI } = require('@varandas/clash-royale-api');

// === Konfiguration ===
const API_KEY = process.env.CR_API_KEY;
if (!API_KEY) {
  console.error('Bitte Umgebungsvariable CR_API_KEY setzen.');
  process.exit(1);
}
const api = new ClashRoyaleAPI(API_KEY);

// === Helfer ===
/**
 * Sucht alle Clans mit Namen (case-insensitive) und filtert ggf. nach Spieler.
 * Gibt den eindeutigen Clan-Tag inklusive '#' zurück.
 */
async function findClanTag(clanNameInput, playerNameLower) {
  const clans = await api.getClans({ name: clanNameInput });
  if (!Array.isArray(clans) || clans.length === 0) {
    throw new Error(`Kein Clan mit Namen "${clanNameInput}" gefunden.`);
  }
  const exact = clans.filter(c => c.name.toLowerCase() === clanNameInput.toLowerCase());
  if (exact.length === 0) {
    throw new Error(`Kein Clan mit exakt dem Namen "${clanNameInput}" gefunden.`);
  }
  if (exact.length === 1) {
    return exact[0].tag;
  }
  // mehrere Clans: prüfe Mitgliedschaft (case-insensitive)
  const matches = [];
  for (const clan of exact) {
    try {
      const members = await api.getClanMembers(clan.tag);
      if (Array.isArray(members) && members.some(m => m.name.toLowerCase() === playerNameLower)) {
        matches.push(clan);
      }
    } catch (_) {}
  }
  if (matches.length === 0) {
    throw new Error(`Spieler nicht in einem Clan namens "${clanNameInput}" gefunden.`);
  }
  if (matches.length > 1) {
    const list = matches.map(c => `${c.name} (${c.tag})`).join('\n - ');
    throw new Error(`Spieler in mehreren Clans namens "${clanNameInput}":\n - ${list}\nBitte gib den genauen ClanTag an.`);
  }
  return matches[0].tag;
}

/**
 * Holt den Spieler-Tag aus einem Clan (Tag inklusive '#'), case-insensitive Name.
 */
async function getPlayerTagFromClan(clanTag, playerNameLower) {
  const members = await api.getClanMembers(clanTag);
  if (!Array.isArray(members)) {
    throw new Error(`Fehler beim Abruf der Mitglieder für Clan ${clanTag}.`);
  }
  const member = members.find(m => m.name.toLowerCase() === playerNameLower);
  if (!member) {
    throw new Error(`Spieler nicht im Clan ${clanTag} gefunden.`);
  }
  return member.tag;
}

/**
 * Liest den BattleLog, wählt das zuletzt gespielte PvP-Match und liefert das Deck des Spielers.
 */
async function fetchPlayerDeck(playerTag) {
  const log = await api.getPlayerBattleLog(playerTag);
  if (Array.isArray(log) && log.length) {
    const pvpBattles = log
      .filter(b => b.type === 'PvP' && b.battleTime)
      .sort((a, b) => new Date(b.battleTime) - new Date(a.battleTime));
    if (pvpBattles.length) {
      const latest = pvpBattles[0];
      const teamEntry = Array.isArray(latest.team)
        ? latest.team.find(t => t.tag === playerTag)
        : latest.team;
      if (teamEntry && Array.isArray(teamEntry.cards) && teamEntry.cards.length) {
        return teamEntry.cards;
      }
    }
  }
  console.warn('Kein PvP-Deck gefunden, verwende aktuelles Deck aus dem Profil.');
  const profile = await api.getPlayerByTag(playerTag);
  if (Array.isArray(profile.currentDeck) && profile.currentDeck.length) {
    return profile.currentDeck;
  }
  throw new Error('Kein Deck gefunden (weder PvP noch Profil).');
}

// === Main ===
(async () => {
  try {
    let [,, clanInput, playerName] = process.argv;
    if (!clanInput || !playerName) {
      console.error('Usage: node index.js <ClanName|#ClanTag> <PlayerName>');
      process.exit(1);
    }
    const playerNameLower = playerName.toLowerCase();
    clanInput = clanInput.replace(/^#/, '');

    // Clan-Tag bestimmen
    const clanTag = clanInput.startsWith('#')
      ? `#${clanInput}`
      : await findClanTag(clanInput, playerNameLower);
    console.log(`Clan-Tag: ${clanTag}`);

    // Spieler-Tag holen
    const playerTag = await getPlayerTagFromClan(clanTag, playerNameLower);
    console.log(`Spieler-Tag: ${playerTag}`);

    // Deck abrufen
    console.log('Zuletzt gespieltes Deck von', playerName, ':');
    const deck = await fetchPlayerDeck(playerTag);
    deck.forEach(card => console.log(` - ${card.name}`));
  } catch (err) {
    console.error('Fehler:', err.message);
    process.exit(1);
  }
})();
