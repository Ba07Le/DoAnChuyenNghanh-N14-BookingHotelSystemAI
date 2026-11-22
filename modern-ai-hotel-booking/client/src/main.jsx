import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// ===============================
// REACT QUERY - ADMIN TUẤN ANH
// ===============================
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ===============================
// APP
// ===============================
import App from "./App";

// ===============================
// CONTEXT HIỆN TẠI
// ===============================
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";

// ===============================
// TOAST PROVIDER - ADMIN TUẤN ANH
// ===============================
import { ToastProvider } from "./components/admin/Toast";

// ===============================
// CHATBOT HIỆN TẠI
// ===============================
import ChatWidget from "./components/chatWidget";

// ===============================
// GLOBAL CSS
// ===============================
import "./index.css";

// ===============================
// REACT QUERY CONFIGURATION
// ===============================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ===============================
// RENDER APPLICATION
// ===============================
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <WishlistProvider>
            <ToastProvider>
              <App />
              <ChatWidget />
            </ToastProvider>
          </WishlistProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
