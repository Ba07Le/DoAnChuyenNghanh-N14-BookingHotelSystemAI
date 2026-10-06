import api from "./apiClient";
export const searchHotels=async(params)=> (await api.get("/hotels/search",{params})).data;
export const getHotelBySlug=async(slug)=> (await api.get(`/hotels/slug/${slug}`)).data;
export const getManagedHotels=async()=> (await api.get("/hotels/manage/list")).data;
export const createHotel=async(data)=> (await api.post("/hotels",data)).data;
export const updateHotel=async(id,data)=> (await api.put(`/hotels/${id}`,data)).data;
export const deleteHotel=async(id)=> (await api.delete(`/hotels/${id}`)).data;
