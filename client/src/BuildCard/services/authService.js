import api from "./api";

export async function changePassword(currentPassword, newPassword) {
  const response = await api.put("/auth/password", {
    currentPassword,
    newPassword,
  });
  return response.data;
}

export async function deleteAccount(password) {
  const response = await api.delete("/auth/account", { data: { password } });
  return response.data;
}
