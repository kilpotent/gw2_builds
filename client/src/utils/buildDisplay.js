// Flattens a build's gear + weapons into a single ordered list of
// {id, name, icon} items, for compact icon-row previews on build cards.
export function collectGearIcons(data) {
  const gear = data?.gear || {};
  const weaponSets = data?.weapons || {};
  const skills = data?.skills || {};
  const items = [gear.amulet, gear.rune, gear.relic];

  ["set1", "set2"].forEach((key) => {
    const ws = weaponSets[key];
    if (!ws) return;
    if (ws.type === "twoHand") {
      items.push(ws.twoHand, ws.sigil1, ws.sigil2);
    } else {
      items.push(ws.main, ws.sigil1, ws.off, ws.sigil2);
    }
  });

  items.push(skills.heal, ...(skills.utilities || []), skills.elite);

  return items.filter(Boolean);
}
