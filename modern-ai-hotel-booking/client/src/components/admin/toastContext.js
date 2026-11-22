import { createContext, useContext } from "react";

export const ToastCtx = createContext({ success: () => {}, error: () => {} });
export const useToast = () => useContext(ToastCtx);
