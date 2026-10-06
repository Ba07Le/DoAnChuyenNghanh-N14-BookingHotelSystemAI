import api from "./apiClient";
export const getRecommendations = async (params) => (await api.get("/ai/recommendations", { params })).data;
export const sendAIMessage = async (message) => (await api.post("/ai/chat", { message })).data;
