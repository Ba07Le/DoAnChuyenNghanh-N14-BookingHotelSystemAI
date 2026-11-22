import api from "./apiClient";

export const getMyProfile = async () => (await api.get("/users/me")).data;

export const updateMyProfile = async (data) => (await api.patch("/users/me", data)).data;
