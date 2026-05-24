import { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, validateToken, changePassword as apiChangePassword } from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('currentUser');

        if (storedToken && storedUser) {
          const isValid = await validateToken();
          if (isValid) {
            setAuthToken(storedToken);
            setCurrentUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } else {
            clearAuth();
          }
        }
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, senha) => {
    try {
      setIsLoading(true);
      const response = await apiLogin(email, senha);

      const { token, mustChangePassword: mcp } = response;
      const user = { ...response.user, id: response.user?.userId };

      setAuthToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setMustChangePassword(mcp);

      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));

      return { success: true, user, mustChangePassword: mcp };
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao fazer login' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (senhaAtual, novaSenha, confirmarNovaSenha) => {
    try {
      setIsLoading(true);
      await apiChangePassword(senhaAtual, novaSenha, confirmarNovaSenha);
      setMustChangePassword(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao alterar senha' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    window.location.href = '/';
  }, []);

  const clearAuth = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setMustChangePassword(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  };

  /** Atualiza campos do usuário logado no estado e no localStorage */
  const updateUser = useCallback((patch) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    authToken,
    currentUser,
    isLoading,
    isAuthenticated,
    mustChangePassword,
    login,
    logout,
    changePassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
