import api from "./apiClient"; export const getHotelTypes=async()=>(await api.get("/hotel-types")).data; export const getDestinations=async()=>(await api.get("/destinations")).data;
export const getFilterOptions = async () => (await api.get("/filter-options")).data;
