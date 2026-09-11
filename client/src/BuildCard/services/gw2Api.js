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
