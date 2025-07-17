const { ClashRoyaleAPI } = require('@varandas/clash-royale-api');

const API_KEY = process.env.CR_API_KEY;
if (!API_KEY) {
  console.error('Please set the CR_API_KEY environment variable.');
  process.exit(1);
}
const api = new ClashRoyaleAPI(API_KEY);

/**
 * Finds the clan tag by exact name match checks membership if multiple clans share the name.
 * Returns the unique clan tag including '#'.
 */
async function findClanTag(clanNameInput, playerNameLower) {
  const clans = await api.getClans({ name: clanNameInput });
  if (!Array.isArray(clans) || clans.length === 0) {
    throw new Error(`No clan found with name "${clanNameInput}".`);
  }
  const exact = clans.filter(c => c.name.toLowerCase() === clanNameInput.toLowerCase());
  if (exact.length === 0) {
    throw new Error(`No exact clan match for "${clanNameInput}".`);
  }
  if (exact.length === 1) {
    return exact[0].tag;
  }
  // Multiple clans matched: check which one the player belongs to
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
    throw new Error(`Player not found in any clan named "${clanNameInput}".`);
  }
  if (matches.length > 1) {
    const list = matches.map(c => `${c.name} (${c.tag})`).join('\n - ');
    throw new Error(`Player belongs to multiple clans named "${clanNameInput}":\n - ${list}\nPlease specify the exact clan tag.`);
  }
  return matches[0].tag;
}

/**
 * Retrieves the player tag from a clan's member list.
 * Returns the tag including '#'.
 */
async function getPlayerTagFromClan(clanTag, playerNameLower) {
  const members = await api.getClanMembers(clanTag);
  if (!Array.isArray(members)) {
    throw new Error(`Failed to fetch members for clan ${clanTag}.`);
  }
  const member = members.find(m => m.name.toLowerCase() === playerNameLower);
  if (!member) {
    throw new Error(`Player not found in clan ${clanTag}.`);
  }
  return member.tag;
}

/**
 * Reads the battle log, selects the most recent PvP match, and returns the player's deck from that match.
 * Falls back to the player's current profile deck if no PvP match is found.
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
  console.warn('No PvP deck found; using current deck from player profile.');
  const profile = await api.getPlayerByTag(playerTag);
  if (Array.isArray(profile.currentDeck) && profile.currentDeck.length) {
    return profile.currentDeck;
  }
  throw new Error('No deck available (neither PvP log nor profile).');
}

// === Main Execution ===
(async () => {
  try {
    let [,, clanInput, playerName] = process.argv;
    if (!clanInput || !playerName) {
      console.error('Usage: node index.js <ClanName|#ClanTag> <PlayerName>');
      process.exit(1);
    }
    const playerNameLower = playerName.toLowerCase();
    clanInput = clanInput.replace(/^#/, '');

    // Determine clan tag
    const clanTag = clanInput.startsWith('#')
      ? `#${clanInput}`
      : await findClanTag(clanInput, playerNameLower);
    console.log(`Clan Tag: ${clanTag}`);

    // Retrieve player tag
    const playerTag = await getPlayerTagFromClan(clanTag, playerNameLower);
    console.log(`Player Tag: ${playerTag}`);

    // Fetch and display deck
    console.log(`Last played deck for ${playerName}:`);
    const deck = await fetchPlayerDeck(playerTag);
    deck.forEach(card => console.log(` - ${card.name}`));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
