import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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

    if (!error.response) {
      console.error('Erro de rede:', error);
      return Promise.reject(new Error('Erro de conexão com o servidor'));
    }

    return Promise.reject(error);
  },
);

export const login = async (email, senha) => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.');
  }
};

export const changePassword = async (senhaAtual, novaSenha, confirmarNovaSenha) => {
  try {
    await api.patch('/auth/change-password', { senhaAtual, novaSenha, confirmarNovaSenha });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao alterar senha');
  }
};

export const validateToken = async () => {
  try {
    await api.get('/auth/validate');
    return true;
  } catch (error) {
    return false;
  }
};

export const getAllPatients = async () => {
  try {
    const response = await api.get('/patient');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao carregar lista de pacientes');
  }
};

export const createPatient = async (patientData) => {
  try {
    const response = await api.post('/patient', patientData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao cadastrar paciente');
  }
};

export const updatePatient = async (id, patientData) => {
  try {
    const response = await api.put(`/patient/${id}`, patientData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao atualizar paciente');
  }
};

export const deletePatient = async (email) => {
  try {
    await api.delete(`/patient/${email}`);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao desativar paciente');
  }
};

export const getPatientByEmail = async (email) => {
  try {
    const response = await api.get(`/patient/${email}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao carregar dados do paciente');
  }
};

export const getAllDoctors = async () => {
  try {
    const response = await api.get('/doctor');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao carregar lista de profissionais');
  }
};

export const createDoctor = async (doctorData) => {
  try {
    const response = await api.post('/doctor', doctorData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao cadastrar profissional');
  }
};

export const updateDoctor = async (id, doctorData) => {
  try {
    const response = await api.put(`/doctor/${id}`, doctorData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao atualizar profissional');
  }
};

export const deleteDoctor = async (id) => {
  try {
    await api.delete(`/doctor/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao remover profissional');
  }
};

export const get = async (endpoint) => {
  const response = await api.get(endpoint);
  return response.data;
};

export const post = async (endpoint, data) => {
  const response = await api.post(endpoint, data);
  return response.data;
};

export const put = async (endpoint, data) => {
  const response = await api.put(endpoint, data);
  return response.data;
};

export const del = async (endpoint) => {
  const response = await api.delete(endpoint);
  return response.data;
};

export default api;
