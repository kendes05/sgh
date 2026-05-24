// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook customizado para acessar o contexto de autenticação
 * Facilita o uso do AuthContext em componentes
 * 
 * @example
 * const { login, logout, currentUser, isAdmin } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export default useAuth;