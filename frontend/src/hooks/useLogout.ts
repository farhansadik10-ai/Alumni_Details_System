import { useCallback, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../routes/paths";
import { logout as logoutRequest } from "../services/usersApi";
import { TOKEN_STORAGE_KEY, currentUserAtom, tokenAtom } from "../store/authAtom";
import { isExpired } from "../utils/jwt";

export interface UseLogoutResult {
  logout: () => Promise<void>;
  loggingOut: boolean;
}

// Records logout_at on the backend, then ends the session in the browser and goes to the login page.
export default function useLogout(): UseLogoutResult {
  const user = useAtomValue(currentUserAtom);
  const setToken = useSetAtom(tokenAtom);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    // An expired token would get a 401 (and the apiClient redirect), so only call with a live one.
    if (user && !isExpired(user)) {
      try {
        await logoutRequest(user.id);
      } catch {
        // Recording logout_at is best effort: the user is logged out locally either way.
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setLoggingOut(false);
    navigate(PATHS.LOGIN, { replace: true });
  }, [user, setToken, navigate]);

  return { logout, loggingOut };
}
