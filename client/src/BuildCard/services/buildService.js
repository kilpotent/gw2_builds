import api from "./api";

export async function getPublicBuilds() {
  const response = await api.get("/builds/public");
  return response.data.builds;
}

export async function createBuild({
  characterId,
  buildName,
  gameMode,
  data,
  isPublic,
}) {
  const response = await api.post("/builds", {
    characterId,
    buildName,
    gameMode,
    data,
    isPublic,
  });
  return response.data.build;
}
