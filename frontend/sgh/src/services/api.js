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

// ─── Pacientes (patient-service) ─────────────────────────────────────────────

export const getAllPatients = async () => {
  try {
    const { data } = await api.get('/patients');
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar pacientes.'));
  }
};

export const getPatientStats = async () => {
  try {
    const { data } = await api.get('/patients/stats');
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar estatísticas de pacientes.'));
  }
};

export const searchPatientByEmail = async (email) => {
  try {
    const { data } = await api.get('/patients', { params: { email } });
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao buscar paciente por e-mail.'));
  }
};

export const searchPatientByCpf = async (cpf) => {
  try {
    const { data } = await api.get(`/patients/cpf/${cpf}`);
    // endpoint retorna um único paciente, normaliza para array
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw new Error(extractError(error, 'Erro ao buscar paciente por CPF.'));
  }
};

export const createPatient = async (payload) => {
  try {
    const { data } = await api.post('/patients', payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao cadastrar paciente.'));
  }
};

export const updatePatient = async (id, payload) => {
  try {
    const { data } = await api.put(`/patients/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao atualizar paciente.'));
  }
};

export const deletePatient = async (id) => {
  try {
    await api.delete(`/patients/${id}`);
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao desativar paciente.'));
  }
};

// ─── Triagem (screening-service) ─────────────────────────────────────────────

export const getScreeningStats = async () => {
  try {
    const { data } = await api.get('/screenings/stats');
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar estatísticas.'));
  }
};

/**
 * Lista triagens. Parâmetros opcionais: { status, patientId }
 */
export const getScreenings = async (params = {}) => {
  try {
    const { data } = await api.get('/screenings', { params });
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao carregar triagens.'));
  }
};

/**
 * Cria uma triagem.
 * Body: { patientId, patientName, patientBirthDate, susCardNumber?, medicalRecordNumber?,
 *         triageProfessionalId, mainComplaint, symptoms?, complementarySymptoms?,
 *         allergies?, medicationsInUse?, comorbidities?, generalNotes?,
 *         vitalSigns: { pressaoSistolica, pressaoDiastolica, frequenciaCardiaca,
 *                       temperatura, frequenciaRespiratoria, saturacaoOxigenio,
 *                       glicemia?, escalaDor } }
 */
export const createScreening = async (payload) => {
  try {
    const { data } = await api.post('/screenings', payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao criar triagem.'));
  }
};

/**
 * Solicita sugestão de classificação da IA para a triagem.
 * Retorna: { suggestedPriority, score, maxWaitMinutes, reasons[] }
 */
export const getClassificationSuggestion = async (screeningId) => {
  try {
    const { data } = await api.post(`/screenings/${screeningId}/classification/suggestion`);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao obter sugestão de classificação.'));
  }
};

/**
 * Confirma a classificação de risco da triagem (requer role NURSE ou MEDIC).
 * Body: { professionalId, finalPriority, overrideJustification? }
 * Enums PriorityLevel: VERMELHO, LARANJA, AMARELO, VERDE, AZUL
 */
export const validateClassification = async (screeningId, payload) => {
  try {
    const { data } = await api.post(`/screenings/${screeningId}/classification`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao confirmar classificação.'));
  }
};

/**
 * Encaminha o paciente para um setor.
 * Body: { professionalId, destinationSector?, routingNotes? }
 * Enums DestinationSector: SALA_EMERGENCIA, CONSULTORIO_CLINICA_GERAL,
 *   CONSULTORIO_PEDIATRICO, CONSULTORIO_ORTOPEDICO, SALA_MEDICACAO,
 *   OBSERVACAO, SALA_SUTURAS
 */
export const routeScreening = async (screeningId, payload) => {
  try {
    const { data } = await api.post(`/screenings/${screeningId}/routing`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao encaminhar paciente.'));
  }
};

// ─── Prontuários (medical-records-service) ────────────────────────────────────

/**
 * Busca o prontuário pelo ID do paciente.
 * Retorna null se não encontrado (404).
 */
export const getMedicalRecordByPatient = async (patientId) => {
  try {
    const { data } = await api.get(`/medical-records/patient/${patientId}`);
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw new Error(extractError(error, 'Erro ao carregar prontuário.'));
  }
};

/**
 * Cria um prontuário para o paciente.
 * Body: { idPaciente }
 */
export const createMedicalRecord = async (patientId) => {
  try {
    const { data } = await api.post('/medical-records', { idPaciente: patientId });
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao criar prontuário.'));
  }
};

/**
 * Adiciona medicamento ao prontuário.
 * Body: { nomeMedicamento, dosagem, duracaoTratamento, observacoes?, dataInicio? }
 */
export const addMedication = async (recordId, payload) => {
  try {
    const { data } = await api.post(`/medical-records/${recordId}/medications`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao adicionar medicamento.'));
  }
};

/**
 * Adiciona exame ao prontuário.
 * Body: { tipoExame, dataRealizacao, resultadoTexto?, resultadoEstruturado? }
 */
export const addExam = async (recordId, payload) => {
  try {
    const { data } = await api.post(`/medical-records/${recordId}/exams`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error, 'Erro ao adicionar exame.'));
  }
};

export default api;
