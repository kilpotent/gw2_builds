import axios from "axios";

const gw2Api = axios.create({
  baseURL: "https://api.guildwars2.com/v2",
});

export async function getProfessionDetails(professionName) {
  const response = await gw2Api.get(`/professions/${professionName}`);
  return response.data;
}

export async function getSpecializations(ids) {
  const response = await gw2Api.get("/specializations", {
    params: { ids: ids.join(",") },
  });
  return response.data;
}

export async function getTraits(ids) {
  if (!ids || ids.length === 0) return [];
  const response = await gw2Api.get("/traits", {
    params: { ids: ids.join(",") },
  });
  return response.data;
}

export async function getProfessions(ids) {
  const response = await gw2Api.get("/professions", {
    params: { ids: ids.join(",") },
  });
  return response.data;
}

export async function getAmulets() {
  const idsResponse = await gw2Api.get("/pvp/amulets");
  const details = await gw2Api.get("/pvp/amulets", {
    params: { ids: idsResponse.data.join(",") },
  });
  return details.data;
}

export async function getSkills(ids) {
  if (!ids || ids.length === 0) return [];
  const response = await gw2Api.get("/skills", {
    params: { ids: ids.join(",") },
  });
  return response.data;
}

// The profession endpoint lists weapon types with hand-slot flags
// (Mainhand/Offhand/TwoHand) but no icon of its own, so we borrow the icon
// of each weapon's first skill (its autoattack) to represent it visually.
export async function getProfessionWeapons(professionName) {
  const professionData = await getProfessionDetails(professionName);
  const entries = Object.entries(professionData.weapons || {}).filter(
    ([, w]) => !w.flags.includes("Aquatic"),
  );

  const repSkillFor = (w) => w.skills.find((s) => s.slot === "Weapon_1") || w.skills[0];

  const skillIds = entries.map(([, w]) => repSkillFor(w)?.id).filter(Boolean);
  const skills = skillIds.length ? await getSkills(skillIds) : [];
  const skillsById = {};
  skills.forEach((s) => {
    skillsById[s.id] = s;
  });

  return entries.map(([name, w]) => {
    const repSkill = repSkillFor(w);
    const skill = repSkill ? skillsById[repSkill.id] : null;
    return {
      id: name,
      name,
      icon: skill?.icon || null,
      flags: w.flags,
    };
  });
}

// Heal/Utility/Elite skills for a profession. Some are locked to a core or
// elite specialization (skill.specialization matches a specialization id) —
// the caller filters those against the build's currently chosen lines.
export async function getProfessionSkills(professionName) {
  const professionData = await getProfessionDetails(professionName);
  const relevant = (professionData.skills || []).filter((s) =>
    ["Heal", "Utility", "Elite"].includes(s.type),
  );
  const ids = [...new Set(relevant.map((s) => s.id))];
  const skills = ids.length ? await getSkills(ids) : [];

  return skills.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    description: s.description,
    slot: s.slot,
    specialization: s.specialization || null,
  }));
}
