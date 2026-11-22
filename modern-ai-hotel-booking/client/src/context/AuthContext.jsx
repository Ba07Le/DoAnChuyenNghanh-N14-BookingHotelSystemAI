import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getMe } from "../api/authApi";

const AuthContext = createContext(null);

const readToken = () => {
  const token = localStorage.getItem("token")?.trim();
  return token && token !== "undefined" && token !== "null" ? token : null;
};

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

// Prevent duplicate /auth/me calls under React.StrictMode.
let pendingCheck = null;
let pendingCheckToken = null;
const checkSession = (token) => {
  if (pendingCheck && pendingCheckToken === token) return pendingCheck;
  pendingCheckToken = token;
  pendingCheck = getMe().finally(() => {
    pendingCheck = null;
    pendingCheckToken = null;
  });
  return pendingCheck;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(readUser);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(Boolean(readToken()));
  const currentTokenRef = useRef(token);

  const logout = () => {
    currentTokenRef.current = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setSessionVerified(false);
    setSessionChecking(false);
  };

  const login = (data) => {
    if (!data?.token || !data?.user) return false;
    // A successful login response is already authenticated by the backend.
    currentTokenRef.current = data.token;
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setSessionVerified(true);
    setSessionChecking(false);
    return true;
  };

  // Only validate a token restored on initial page load, NOT a freshly issued
  // token after login. This avoids a stale /auth/me response logging out a new session.
  useEffect(() => {
    const restoredToken = currentTokenRef.current;
    if (!restoredToken) {
      setSessionChecking(false);
      return undefined;
    }

    let active = true;
    checkSession(restoredToken)
      .then((response) => {
        if (!active || currentTokenRef.current !== restoredToken) return;
        if (response?.success && response?.user) {
          setUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
          setSessionVerified(true);
          setSessionChecking(false);
        } else {
          logout();
        }
      })
      .catch((error) => {
        if (!active || currentTokenRef.current !== restoredToken) return;
        if (error.response?.status === 401) logout();
        else {
          setSessionVerified(false);
          setSessionChecking(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        sessionVerified,
        sessionChecking,
        isAuthenticated: Boolean(token && user && sessionVerified),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
