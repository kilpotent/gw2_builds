import api from "./api";

export async function getPublicBuilds() {
  const response = await api.get("/builds/public");
  return response.data.builds;
}

export async function getPublicBuild(id) {
  const response = await api.get(`/builds/public/${id}`);
  return response.data.build;
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

export async function getMyBuilds() {
  const response = await api.get("/builds/mine");
  return response.data.builds;
}

export async function getBuild(id) {
  const response = await api.get(`/builds/${id}`);
  return response.data.build;
}

export async function updateBuild(id, { buildName, gameMode, data, isPublic }) {
  const response = await api.put(`/builds/${id}`, {
    buildName,
    gameMode,
    data,
    isPublic,
  });
  return response.data.build;
}

export async function deleteBuild(id) {
  await api.delete(`/builds/${id}`);
}
