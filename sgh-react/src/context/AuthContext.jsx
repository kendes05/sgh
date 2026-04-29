// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, validateToken, changePassword as apiChangePassword } from '../services/api';

export const AuthContext = createContext({});

/**
 * Provider de Autenticação
 * Gerencia o estado global de autenticação da aplicação
 */
export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  /**
   * Inicializa o estado de autenticação ao carregar a aplicação
   * Verifica se há token e usuário salvos no localStorage
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('currentUser');

        if (storedToken && storedUser) {
          // Valida se o token ainda é válido
          const isValid = await validateToken();
          
          if (isValid) {
            setAuthToken(storedToken);
            setCurrentUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } else {
            // Token expirado, limpa tudo
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const changePassword = useCallback(async (senhaAtual, novaSenha, confirmarNovaSenha) => {
    try {
      setIsLoading(true);


      const response = await apiChangePassword(senhaAtual, novaSenha, confirmarNovaSenha);

      setMustChangePassword(false);

      return { success: true };

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { success: false, error: error.message || 'Erro ao alterar senha' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Função de login
   * @param {string} email 
   * @param {string} senha 
   * @returns {Promise<void>}
   */
  const login = useCallback(async (email, senha) => {
    try {
      setIsLoading(true);

      // Chama a API de login
      const response = await apiLogin(email, senha);

      console.log('Resposta do login:', response);
      
      const { token, user, mustChangePassword } = response;

      // Salva no estado
      setAuthToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setMustChangePassword(mustChangePassword);

      // Persiste no localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));


      return { success: true, user, mustChangePassword };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Função de logout
   * Limpa todos os dados de autenticação
   */
  const logout = useCallback(() => {
    clearAuth();
    // Redireciona para a tela de login
    window.location.href = '/';
  }, []);

  /**
   * Limpa o estado de autenticação
   */
  const clearAuth = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  };

  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
    // Não precisa remover do localStorage
  }, []);
  

  /**
   * Verifica se o usuário é admin
   * @returns {boolean}
   */
  const isAdmin = useCallback(() => {
    return currentUser?.role === 'ADMIN' || currentUser?.role === 'admin';
  }, [currentUser]);

  /**
   * Verifica se o usuário é paciente
   * @returns {boolean}
   */
  const isPatient = useCallback(() => {
    return currentUser?.role === 'PATIENT' || currentUser?.role === 'patient';
  }, [currentUser]);

  /**
   * Atualiza os dados do usuário atual
   * @param {object} userData 
   */
  const updateUser = useCallback((userData) => {
    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }, [currentUser]);

  /**
   * Obtém o token de autenticação
   * @returns {string|null}
   */
  const getToken = useCallback(() => {
    return authToken;
  }, [authToken]);

  // Valor do contexto disponível para todos os componentes
  const value = {
    // Estado
    authToken,
    currentUser,
    isLoading,
    isAuthenticated,
    mustChangePassword,
    
    // Funções
    login,
    logout,
    isAdmin,
    isPatient,
    updateUser,
    getToken,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;