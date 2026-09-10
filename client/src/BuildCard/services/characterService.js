import api from "./api";

export async function getCharacters() {
  const response = await api.get("/characters");
  return response.data.characters;
}

export async function createCharacter(name, profession) {
  const response = await api.post("/characters", { name, profession });
  return response.data.character;
}

export async function deleteCharacter(id) {
  await api.delete(`/characters/${id}`);
}
