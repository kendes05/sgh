import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
    if (!error.response) return Promise.reject(new Error('Erro de conexão com o servidor'));
    return Promise.reject(error);
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractError = (error, fallback) =>
  error.response?.data?.message || error.response?.data || fallback;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (email, senha) => {
  try {
    const { data } = await api.post('/auth/login', { email, senha });
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Credenciais inválidas. Verifique seu e-mail e senha.'));
  }
};

export const changePassword = async (senhaAtual, novaSenha, confirmarNovaSenha) => {
  try {
    await api.patch('/auth/change-password', { senhaAtual, novaSenha, confirmarNovaSenha });
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao alterar senha. Verifique a senha atual.'));
  }
};

export const validateToken = async () => {
  try {
    await api.get('/auth/validate');
    return true;
  } catch {
    return false;
  }
};

// ─── Usuários (auth-service) ──────────────────────────────────────────────────

export const getAllUsers = async () => {
  try {
    const { data } = await api.get('/auth/users');
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar usuários.'));
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const { data } = await api.get('/auth/users/me');
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar perfil.'));
  }
};

/** Registra um novo usuário e retorna { authUserId, senha } */
export const registerUser = async ({ nome, email, role }) => {
  try {
    const { data } = await api.post('/auth/register', { nome, email, role });
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao registrar usuário.'));
  }
};

export const updateUserEmail = async (id, email) => {
  try {
    await api.patch(`/auth/users/${id}/email`, { email });
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao atualizar e-mail.'));
  }
};

export const deactivateUser = async (id) => {
  try {
    await api.delete(`/auth/users/${id}`);
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao desativar usuário.'));
  }
};

// ─── Profissionais (doctor-service) ──────────────────────────────────────────

export const getAllDoctors = async () => {
  try {
    const { data } = await api.get('/doctor');
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar profissionais.'));
  }
};

export const getDoctorsByRole = async (role) => {
  try {
    const { data } = await api.get(`/doctor/role/${role}`);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar profissionais por cargo.'));
  }
};

/**
 * Cria um profissional via POST /doctor.
 * O doctor-service já cria o usuário no auth-service internamente
 */
export const createProfissional = async ({ nome, email, role, crmCoren, sexo, telefone, especialidadePrincipal }) => {
  try {

    console.log('Creating professional with data:', { nome, email, role, crmCoren, sexo, telefone, especialidadePrincipal });

    const { data } = await api.post('/doctor', {
      nome, email, role, crmCoren, sexo, telefone, especialidadePrincipal,
    });
    console.log('createProfissional response:', data);
    return { doctor: data, tempPassword: data.tempPassword ?? data.senha ?? null };
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao cadastrar profissional.'));
  }
};

export const updateDoctor = async (id, payload) => {
  try {
    const { data } = await api.put(`/doctor/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao atualizar profissional.'));
  }
};

/**
 * Desativa o profissional nos 2 serviços.
 * Usa o e-mail para localizar o usuário no auth-service.
 */
export const deleteProfissional = async (doctor, allUsers) => {
  await api.delete(`/doctor/${doctor.id}`);
  const authUser = allUsers.find((u) => u.email?.toLowerCase() === doctor.email?.toLowerCase());
  if (authUser) {
    try { await api.delete(`/auth/users/${authUser.id}`); } catch { /* silencia */ }
  }
};

// ─── Triagem — estatísticas (screening-service) ───────────────────────────────

export const getScreeningStats = async () => {
  try {
    const { data } = await api.get('/screenings/stats');
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar estatísticas.'));
  }
};

export default api;
