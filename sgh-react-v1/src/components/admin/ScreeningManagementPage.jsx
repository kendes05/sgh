import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  cancelScreening,
  createScreening,
  finishScreeningAttendance,
  getAllPatients,
  getAllScreenings,
  getScreeningById,
  routeScreening,
  startScreeningAttendance,
  suggestScreeningClassification,
  validateScreeningClassification,
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../layout/DashboardLayout';
import AlertMessage from '../ui/AlertMessage';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'AGUARDANDO_CLASSIFICACAO', label: 'Aguardando classificacao' },
  { value: 'CLASSIFICADA', label: 'Classificada' },
  { value: 'AGUARDANDO_ATENDIMENTO', label: 'Aguardando atendimento' },
  { value: 'EM_ATENDIMENTO', label: 'Em atendimento' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'AUSENTE', label: 'Ausente' },
];

const PRIORITY_OPTIONS = [
  { value: 'VERMELHO', label: 'Vermelho' },
  { value: 'LARANJA', label: 'Laranja' },
  { value: 'AMARELO', label: 'Amarelo' },
  { value: 'VERDE', label: 'Verde' },
  { value: 'AZUL', label: 'Azul' },
];

const DESTINATION_OPTIONS = [
  { value: 'SALA_EMERGENCIA', label: 'Sala de Emergencia' },
  { value: 'CONSULTORIO_CLINICA_GERAL', label: 'Consultorio de Clinica Geral' },
  { value: 'CONSULTORIO_PEDIATRICO', label: 'Consultorio Pediatrico' },
  { value: 'CONSULTORIO_ORTOPEDICO', label: 'Consultorio Ortopedico' },
  { value: 'SALA_MEDICACAO', label: 'Sala de Medicacao' },
  { value: 'OBSERVACAO', label: 'Observacao' },
  { value: 'SALA_SUTURAS', label: 'Sala de Suturas' },
];

const SYMPTOM_OPTIONS = [
  { value: 'TOSSE', label: 'Tosse' },
  { value: 'FALTA_DE_AR', label: 'Falta de ar' },
  { value: 'CHIADO_NO_PEITO', label: 'Chiado no peito' },
  { value: 'DOR_AO_RESPIRAR', label: 'Dor ao respirar' },
  { value: 'DOR_NO_PEITO', label: 'Dor no peito' },
  { value: 'PALPITACOES', label: 'Palpitacoes' },
  { value: 'INCHACO_NAS_PERNAS', label: 'Inchaco nas pernas' },
  { value: 'NAUSEA', label: 'Nausea' },
  { value: 'VOMITO', label: 'Vomito' },
  { value: 'VOMITO_PERSISTENTE', label: 'Vomito persistente' },
  { value: 'DIARREIA', label: 'Diarreia' },
  { value: 'DOR_ABDOMINAL', label: 'Dor abdominal' },
  { value: 'TONTURA', label: 'Tontura' },
  { value: 'CEFALEIA', label: 'Cefaleia' },
  { value: 'ALTERACAO_VISUAL', label: 'Alteracao visual' },
  { value: 'FRAQUEZA_EM_MEMBROS', label: 'Fraqueza em membros' },
  { value: 'TRAUMA', label: 'Trauma' },
  { value: 'HEMORRAGIA_ATIVA', label: 'Hemorragia ativa' },
  { value: 'CONVULSAO', label: 'Convulsao' },
  { value: 'SINAIS_DESIDRATACAO', label: 'Sinais de desidratacao' },
  { value: 'FERIMENTO_COM_CORTE', label: 'Ferimento com corte' },
];

const PRIORITY_META = {
  VERMELHO: { label: 'Vermelho', className: 'critical' },
  LARANJA: { label: 'Laranja', className: 'high' },
  AMARELO: { label: 'Amarelo', className: 'medium' },
  VERDE: { label: 'Verde', className: 'low' },
  AZUL: { label: 'Azul', className: 'info' },
};

const STATUS_META = {
  AGUARDANDO_CLASSIFICACAO: { label: 'Aguardando classificacao', className: 'warning' },
  CLASSIFICADA: { label: 'Classificada', className: 'active' },
  AGUARDANDO_ATENDIMENTO: { label: 'Aguardando atendimento', className: 'info' },
  EM_ATENDIMENTO: { label: 'Em atendimento', className: 'success' },
  FINALIZADA: { label: 'Finalizada', className: 'muted' },
  CANCELADA: { label: 'Cancelada', className: 'error' },
  AUSENTE: { label: 'Ausente', className: 'error' },
};

const INITIAL_FORM = {
  patientId: '',
  patientName: '',
  patientBirthDate: '',
  susCardNumber: '',
  medicalRecordNumber: '',
  triageProfessionalId: '',
  mainComplaint: '',
  symptoms: [],
  complementarySymptoms: '',
  allergies: '',
  medicationsInUse: '',
  comorbidities: '',
  generalNotes: '',
  vitalSigns: {
    pressaoSistolica: '',
    pressaoDiastolica: '',
    frequenciaCardiaca: '',
    temperatura: '',
    frequenciaRespiratoria: '',
    saturacaoOxigenio: '',
    glicemia: '',
    escalaDor: '',
  },
};

const formatDate = (value) => {
  if (!value) {
    return '--';
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
};

const formatDateTime = (value) => {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleString('pt-BR');
};

const formatListLabel = (value) =>
  value
    ?.toLowerCase()
    ?.split('_')
    ?.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    ?.join(' ') ?? '--';

const parseTextList = (value) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const numberOrNull = (value, isDecimal = false) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  return isDecimal ? Number.parseFloat(value) : Number.parseInt(value, 10);
};

const ScreeningFormModal = ({
  isOpen,
  formData,
  patients,
  isSaving,
  error,
  onClose,
  onSubmit,
  onChange,
  onVitalChange,
  onToggleSymptom,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal active" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content screening-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Abrir Nova Triagem</h3>
          <button type="button" className="close-modal" onClick={onClose} aria-label="Fechar modal">
            x
          </button>
        </div>

        <AlertMessage message={error} type="error" />

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patientId">Paciente</label>
              <select id="patientId" name="patientId" value={formData.patientId} onChange={onChange} required>
                <option value="">Selecione um paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id ?? patient.email} value={patient.id}>
                    {patient.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="triageProfessionalId">ID do profissional responsavel</label>
              <input
                id="triageProfessionalId"
                name="triageProfessionalId"
                type="text"
                value={formData.triageProfessionalId}
                onChange={onChange}
                placeholder="UUID do profissional"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patientName">Nome do paciente</label>
              <input id="patientName" name="patientName" type="text" value={formData.patientName} disabled />
            </div>

            <div className="form-group">
              <label htmlFor="patientBirthDate">Data de nascimento</label>
              <input id="patientBirthDate" name="patientBirthDate" type="date" value={formData.patientBirthDate} disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="susCardNumber">Cartao SUS</label>
              <input
                id="susCardNumber"
                name="susCardNumber"
                type="text"
                value={formData.susCardNumber}
                onChange={onChange}
                placeholder="Opcional"
              />
            </div>

            <div className="form-group">
              <label htmlFor="medicalRecordNumber">Numero do prontuario</label>
              <input
                id="medicalRecordNumber"
                name="medicalRecordNumber"
                type="text"
                value={formData.medicalRecordNumber}
                onChange={onChange}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mainComplaint">Queixa principal</label>
            <textarea
              id="mainComplaint"
              name="mainComplaint"
              value={formData.mainComplaint}
              onChange={onChange}
              rows={3}
              maxLength={500}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="complementarySymptoms">Sintomas complementares</label>
            <textarea
              id="complementarySymptoms"
              name="complementarySymptoms"
              value={formData.complementarySymptoms}
              onChange={onChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Sintomas estruturados</label>
            <div className="selection-grid">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <label key={symptom.value} className="check-chip">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom.value)}
                    onChange={() => onToggleSymptom(symptom.value)}
                  />
                  <span>{symptom.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="allergies">Alergias</label>
              <textarea
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={onChange}
                rows={3}
                placeholder="Uma por linha"
              />
            </div>

            <div className="form-group">
              <label htmlFor="medicationsInUse">Medicacoes em uso</label>
              <textarea
                id="medicationsInUse"
                name="medicationsInUse"
                value={formData.medicationsInUse}
                onChange={onChange}
                rows={3}
                placeholder="Uma por linha"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="comorbidities">Comorbidades</label>
              <textarea
                id="comorbidities"
                name="comorbidities"
                value={formData.comorbidities}
                onChange={onChange}
                rows={3}
                placeholder="Uma por linha"
              />
            </div>

            <div className="form-group">
              <label htmlFor="generalNotes">Observacoes gerais</label>
              <textarea id="generalNotes" name="generalNotes" value={formData.generalNotes} onChange={onChange} rows={3} />
            </div>
          </div>

          <div className="section-divider">
            <h4>Sinais vitais</h4>
            <p>Preencha os dados para habilitar a sugestao automatica de prioridade.</p>
          </div>

          <div className="form-row form-row-quad">
            <div className="form-group">
              <label htmlFor="pressaoSistolica">PA sistolica</label>
              <input
                id="pressaoSistolica"
                type="number"
                min="30"
                max="300"
                value={formData.vitalSigns.pressaoSistolica}
                onChange={(event) => onVitalChange('pressaoSistolica', event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pressaoDiastolica">PA diastolica</label>
              <input
                id="pressaoDiastolica"
                type="number"
                min="20"
                max="200"
                value={formData.vitalSigns.pressaoDiastolica}
                onChange={(event) => onVitalChange('pressaoDiastolica', event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="frequenciaCardiaca">FC</label>
              <input
                id="frequenciaCardiaca"
                type="number"
                min="20"
                max="250"
                value={formData.vitalSigns.frequenciaCardiaca}
                onChange={(event) => onVitalChange('frequenciaCardiaca', event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="temperatura">Temperatura</label>
              <input
                id="temperatura"
                type="number"
                min="25"
                max="45"
                step="0.1"
                value={formData.vitalSigns.temperatura}
                onChange={(event) => onVitalChange('temperatura', event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row form-row-quad">
            <div className="form-group">
              <label htmlFor="frequenciaRespiratoria">FR</label>
              <input
                id="frequenciaRespiratoria"
                type="number"
                min="5"
                max="80"
                value={formData.vitalSigns.frequenciaRespiratoria}
                onChange={(event) => onVitalChange('frequenciaRespiratoria', event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="saturacaoOxigenio">SpO2</label>
              <input
                id="saturacaoOxigenio"
                type="number"
                min="50"
                max="100"
                value={formData.vitalSigns.saturacaoOxigenio}
                onChange={(event) => onVitalChange('saturacaoOxigenio', event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="glicemia">Glicemia</label>
              <input
                id="glicemia"
                type="number"
                min="20"
                max="600"
                value={formData.vitalSigns.glicemia}
                onChange={(event) => onVitalChange('glicemia', event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="escalaDor">Escala de dor</label>
              <input
                id="escalaDor"
                type="number"
                min="0"
                max="10"
                value={formData.vitalSigns.escalaDor}
                onChange={(event) => onVitalChange('escalaDor', event.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={`btn ${isSaving ? 'is-loading' : ''}`} disabled={isSaving}>
            {isSaving ? 'Salvando triagem...' : 'Salvar triagem'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ScreeningManagementPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });
  const [selectedScreeningId, setSelectedScreeningId] = useState('');
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isSavingScreening, setIsSavingScreening] = useState(false);
  const [screeningForm, setScreeningForm] = useState({
    ...INITIAL_FORM,
    triageProfessionalId: currentUser?.id ?? '',
  });
  const [classificationForm, setClassificationForm] = useState({
    professionalId: currentUser?.id ?? '',
    finalPriority: '',
    overrideJustification: '',
  });
  const [routingForm, setRoutingForm] = useState({
    professionalId: currentUser?.id ?? '',
    destinationSector: '',
    routingNotes: '',
  });
  const [attendanceForm, setAttendanceForm] = useState({
    professionalId: currentUser?.id ?? '',
    notes: '',
  });
  const [cancelForm, setCancelForm] = useState({
    professionalId: currentUser?.id ?? '',
    reason: '',
    absent: false,
  });

  const loadScreenings = async (statusFilter = filters.status, preferredId = selectedScreeningId) => {
    try {
      setIsLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await getAllScreenings(params);
      setScreenings(data);

      const nextId = preferredId && data.some((item) => item.id === preferredId) ? preferredId : data[0]?.id ?? '';
      setSelectedScreeningId(nextId);

      if (!nextId) {
        setSelectedScreening(null);
        setSuggestion(null);
      }
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [screeningData, patientData] = await Promise.all([getAllScreenings(), getAllPatients()]);
        setScreenings(screeningData);
        setPatients(patientData);

        const firstId = screeningData[0]?.id ?? '';
        setSelectedScreeningId(firstId);
      } catch (error) {
        setFeedback({ message: error.message, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedScreeningId) {
      setSelectedScreening(null);
      setSuggestion(null);
      return;
    }

    const loadDetails = async () => {
      try {
        setIsDetailLoading(true);
        const data = await getScreeningById(selectedScreeningId);
        setSelectedScreening(data);
        setSuggestion(null);
        setClassificationForm((previous) => ({
          ...previous,
          finalPriority: '',
          overrideJustification: '',
        }));
        setRoutingForm((previous) => ({
          ...previous,
          destinationSector: '',
          routingNotes: '',
        }));
      } catch (error) {
        setFeedback({ message: error.message, type: 'error' });
      } finally {
        setIsDetailLoading(false);
      }
    };

    loadDetails();
  }, [selectedScreeningId]);

  useEffect(() => {
    if (currentUser?.id) {
      setScreeningForm((previous) => ({ ...previous, triageProfessionalId: previous.triageProfessionalId || currentUser.id }));
      setClassificationForm((previous) => ({ ...previous, professionalId: previous.professionalId || currentUser.id }));
      setRoutingForm((previous) => ({ ...previous, professionalId: previous.professionalId || currentUser.id }));
      setAttendanceForm((previous) => ({ ...previous, professionalId: previous.professionalId || currentUser.id }));
      setCancelForm((previous) => ({ ...previous, professionalId: previous.professionalId || currentUser.id }));
    }
  }, [currentUser]);

  const stats = useMemo(() => {
    const waitingClassification = screenings.filter((item) => item.status === 'AGUARDANDO_CLASSIFICACAO').length;
    const waitingCare = screenings.filter((item) => item.status === 'AGUARDANDO_ATENDIMENTO').length;
    const inProgress = screenings.filter((item) => item.status === 'EM_ATENDIMENTO').length;
    const finished = screenings.filter((item) => item.status === 'FINALIZADA').length;

    return [
      {
        label: 'Triagens Totais',
        value: screenings.length,
        caption: 'Registros retornados pelo screening-service',
        className: '',
      },
      {
        label: 'Aguardando Classificacao',
        value: waitingClassification,
        caption: 'Casos prontos para avaliacao clinica',
        className: 'warning',
      },
      {
        label: 'Em Fila / Atendimento',
        value: waitingCare + inProgress,
        caption: inProgress > 0 ? `${inProgress} em atendimento agora` : 'Fila clinica em acompanhamento',
        className: 'success',
      },
      {
        label: 'Finalizadas',
        value: finished,
        caption: 'Atendimentos concluidos hoje',
        className: '',
      },
    ];
  }, [screenings]);

  const openCreateModal = () => {
    setCreateError('');
    setScreeningForm({
      ...INITIAL_FORM,
      triageProfessionalId: currentUser?.id ?? '',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateError('');
    setIsCreateModalOpen(false);
  };

  const handleFilterChange = async (event) => {
    const nextStatus = event.target.value;
    setFilters({ status: nextStatus });
    await loadScreenings(nextStatus, selectedScreeningId);
  };

  const handleScreeningFormChange = (event) => {
    const { name, value } = event.target;

    if (name === 'patientId') {
      const patient = patients.find((item) => String(item.id) === value);

      setScreeningForm((previous) => ({
        ...previous,
        patientId: value,
        patientName: patient?.nome ?? '',
        patientBirthDate: patient?.dataNascimento?.slice?.(0, 10) ?? '',
      }));
      return;
    }

    setScreeningForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleVitalChange = (field, value) => {
    setScreeningForm((previous) => ({
      ...previous,
      vitalSigns: {
        ...previous.vitalSigns,
        [field]: value,
      },
    }));
  };

  const handleToggleSymptom = (value) => {
    setScreeningForm((previous) => ({
      ...previous,
      symptoms: previous.symptoms.includes(value)
        ? previous.symptoms.filter((item) => item !== value)
        : [...previous.symptoms, value],
    }));
  };

  const handleCreateScreening = async (event) => {
    event.preventDefault();

    try {
      setIsSavingScreening(true);
      setCreateError('');

      const payload = {
        patientId: screeningForm.patientId,
        patientName: screeningForm.patientName,
        patientBirthDate: screeningForm.patientBirthDate,
        susCardNumber: screeningForm.susCardNumber || null,
        medicalRecordNumber: screeningForm.medicalRecordNumber || null,
        triageProfessionalId: screeningForm.triageProfessionalId,
        mainComplaint: screeningForm.mainComplaint,
        symptoms: screeningForm.symptoms,
        complementarySymptoms: screeningForm.complementarySymptoms || null,
        allergies: parseTextList(screeningForm.allergies),
        medicationsInUse: parseTextList(screeningForm.medicationsInUse),
        comorbidities: parseTextList(screeningForm.comorbidities),
        generalNotes: screeningForm.generalNotes || null,
        vitalSigns: {
          pressaoSistolica: numberOrNull(screeningForm.vitalSigns.pressaoSistolica),
          pressaoDiastolica: numberOrNull(screeningForm.vitalSigns.pressaoDiastolica),
          frequenciaCardiaca: numberOrNull(screeningForm.vitalSigns.frequenciaCardiaca),
          temperatura: numberOrNull(screeningForm.vitalSigns.temperatura, true),
          frequenciaRespiratoria: numberOrNull(screeningForm.vitalSigns.frequenciaRespiratoria),
          saturacaoOxigenio: numberOrNull(screeningForm.vitalSigns.saturacaoOxigenio),
          glicemia: numberOrNull(screeningForm.vitalSigns.glicemia),
          escalaDor: numberOrNull(screeningForm.vitalSigns.escalaDor),
        },
      };

      const created = await createScreening(payload);
      setFeedback({ message: 'Triagem criada com sucesso!', type: 'success' });
      closeCreateModal();
      await loadScreenings(filters.status, created.id);
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsSavingScreening(false);
    }
  };

  const handleSuggestClassification = async () => {
    if (!selectedScreeningId) {
      return;
    }

    try {
      setIsSuggesting(true);
      const response = await suggestScreeningClassification(selectedScreeningId);
      setSuggestion(response);
      setClassificationForm((previous) => ({
        ...previous,
        finalPriority: '',
      }));
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleClassificationFieldChange = (event) => {
    const { name, value } = event.target;
    setClassificationForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRoutingFieldChange = (event) => {
    const { name, value } = event.target;
    setRoutingForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const refreshSelectedScreening = async (id = selectedScreeningId) => {
    const data = await getScreeningById(id);
    setSelectedScreening(data);

    setScreenings((previous) => previous.map((item) => (item.id === data.id ? data : item)));
  };

  const handleValidateClassification = async (event) => {
    event.preventDefault();

    if (!selectedScreeningId) {
      return;
    }

    try {
      setIsActionLoading(true);
      const payload = {
        professionalId: classificationForm.professionalId,
      };

      if (classificationForm.finalPriority) {
        payload.finalPriority = classificationForm.finalPriority;
      }

      if (classificationForm.overrideJustification) {
        payload.overrideJustification = classificationForm.overrideJustification;
      }

      await validateScreeningClassification(selectedScreeningId, payload);
      setFeedback({ message: 'Classificacao final registrada com sucesso!', type: 'success' });
      await refreshSelectedScreening();
      await loadScreenings(filters.status, selectedScreeningId);
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRouteScreening = async (event) => {
    event.preventDefault();

    if (!selectedScreeningId) {
      return;
    }

    try {
      setIsActionLoading(true);
      const payload = {
        professionalId: routingForm.professionalId,
        routingNotes: routingForm.routingNotes || null,
      };

      if (routingForm.destinationSector) {
        payload.destinationSector = routingForm.destinationSector;
      }

      await routeScreening(selectedScreeningId, payload);
      setFeedback({ message: 'Paciente encaminhado com sucesso!', type: 'success' });
      await refreshSelectedScreening();
      await loadScreenings(filters.status, selectedScreeningId);
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartAttendance = async (event) => {
    event.preventDefault();
    if (!selectedScreeningId) return;

    try {
      setIsActionLoading(true);
      await startScreeningAttendance(selectedScreeningId, {
        professionalId: attendanceForm.professionalId,
      });
      setFeedback({ message: 'Atendimento iniciado com sucesso!', type: 'success' });
      await refreshSelectedScreening();
      await loadScreenings(filters.status, selectedScreeningId);
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFinishAttendance = async (event) => {
    event.preventDefault();
    if (!selectedScreeningId) return;

    try {
      setIsActionLoading(true);
      await finishScreeningAttendance(selectedScreeningId, {
        professionalId: attendanceForm.professionalId,
        dischargeNotes: attendanceForm.notes || null,
      });
      setFeedback({ message: 'Atendimento finalizado com sucesso!', type: 'success' });
      await refreshSelectedScreening();
      await loadScreenings(filters.status, selectedScreeningId);
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelScreening = async (event) => {
    event.preventDefault();
    if (!selectedScreeningId) return;

    const action = cancelForm.absent ? 'marcar como ausente' : 'cancelar';
    const confirmed = window.confirm(`Deseja realmente ${action} esta triagem?`);
    if (!confirmed) return;

    try {
      setIsActionLoading(true);
      await cancelScreening(selectedScreeningId, {
        professionalId: cancelForm.professionalId,
        reason: cancelForm.reason,
        absent: cancelForm.absent,
      });
      setFeedback({ message: `Triagem ${cancelForm.absent ? 'marcada como ausente' : 'cancelada'} com sucesso!`, type: 'success' });
      await refreshSelectedScreening();
      await loadScreenings(filters.status, selectedScreeningId);
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const selectedPriorityMeta =
    PRIORITY_META[selectedScreening?.finalPriority] ||
    PRIORITY_META[selectedScreening?.suggestedPriority] ||
    null;

  return (
    <DashboardLayout
      title="SGH - Triagem"
      subtitle="Abertura, classificacao e encaminhamento do paciente"
      userName={currentUser?.nome ?? 'Administrador'}
      onLogout={logout}
    >
      <div className="page-toolbar">
        <button type="button" className="btn btn-secondary btn-inline" onClick={() => navigate('/admin')}>
          Voltar ao painel
        </button>
      </div>

      <AlertMessage message={feedback.message} type={feedback.type} />

      <div className="dashboard-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.className}`.trim()}>
            <h3>{stat.label}</h3>
            <div className="stat-value">{stat.value}</div>
            <p className="stat-caption">{stat.caption}</p>
          </div>
        ))}
      </div>

      <section className="section">
        <div className="section-header">
          <div>
            <span className="section-kicker">Fluxo assistencial</span>
            <h2>Central de Triagens</h2>
            <p className="section-copy">
              Consulte as triagens abertas, filtre por etapa do fluxo e siga para classificacao ou encaminhamento sem sair
              desta area.
            </p>
          </div>

          <div className="toolbar-group">
            <select value={filters.status} onChange={handleFilterChange} aria-label="Filtrar triagens por status">
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button type="button" className="btn btn-inline" onClick={openCreateModal}>
              + Nova Triagem
            </button>
          </div>
        </div>

        <div className="screening-layout">
          <section className="screening-list">
            <div className="table-shell">
              {isLoading ? (
                <LoadingState title="Carregando triagens..." description="Buscando o fluxo mais recente no screening-service." />
              ) : screenings.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Status</th>
                        <th>Prioridade</th>
                        <th>Criada em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {screenings.map((screening) => {
                        const statusMeta = STATUS_META[screening.status];
                        const priorityMeta =
                          PRIORITY_META[screening.finalPriority] || PRIORITY_META[screening.suggestedPriority] || null;

                        return (
                          <tr
                            key={screening.id}
                            className={screening.id === selectedScreeningId ? 'screening-row-selected' : ''}
                            onClick={() => setSelectedScreeningId(screening.id)}
                          >
                            <td>
                              <div className="screening-cell-title">{screening.patientName}</div>
                              <div className="screening-cell-subtitle">{screening.id}</div>
                            </td>
                            <td>
                              <span className={`status-pill ${statusMeta?.className ?? 'info'}`}>{statusMeta?.label ?? screening.status}</span>
                            </td>
                            <td>
                              {priorityMeta ? (
                                <span className={`priority-pill ${priorityMeta.className}`}>{priorityMeta.label}</span>
                              ) : (
                                <span className="muted-copy">Pendente</span>
                              )}
                            </td>
                            <td>{formatDateTime(screening.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon="TR" message="Nenhuma triagem encontrada para o filtro selecionado." />
              )}
            </div>
          </section>

          <section className="screening-detail section-subcard">
            {isDetailLoading ? (
              <LoadingState title="Carregando detalhes..." description="Montando o contexto clinico da triagem selecionada." />
            ) : !selectedScreening ? (
              <EmptyState icon="+" message="Selecione uma triagem para visualizar o detalhe completo." />
            ) : (
              <>
                <div className="detail-header">
                  <div>
                    <div className="detail-badges">
                      <span className={`status-pill ${STATUS_META[selectedScreening.status]?.className ?? 'info'}`}>
                        {STATUS_META[selectedScreening.status]?.label ?? selectedScreening.status}
                      </span>
                      {selectedPriorityMeta ? (
                        <span className={`priority-pill ${selectedPriorityMeta.className}`}>{selectedPriorityMeta.label}</span>
                      ) : null}
                    </div>
                    <h3>{selectedScreening.patientName}</h3>
                    <p className="section-copy">
                      Protocolo {selectedScreening.protocol ?? '--'} • criada em {formatDateTime(selectedScreening.createdAt)}
                    </p>
                  </div>

                  <button type="button" className="action-btn btn-edit" onClick={() => refreshSelectedScreening()}>
                    Atualizar detalhe
                  </button>
                </div>

                <div className="patient-info screening-summary-grid">
                  <div className="info-item">
                    <div className="info-label">Paciente ID</div>
                    <div className="info-value">{selectedScreening.patientId}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Nascimento</div>
                    <div className="info-value">{formatDate(selectedScreening.patientBirthDate)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Prontuario</div>
                    <div className="info-value">{selectedScreening.medicalRecordNumber || '--'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Cartao SUS</div>
                    <div className="info-value">{selectedScreening.susCardNumber || '--'}</div>
                  </div>
                </div>

                <div className="screening-copy-block">
                  <h4>Queixa principal</h4>
                  <p>{selectedScreening.mainComplaint}</p>
                </div>

                {selectedScreening.complementarySymptoms ? (
                  <div className="screening-copy-block">
                    <h4>Sintomas complementares</h4>
                    <p>{selectedScreening.complementarySymptoms}</p>
                  </div>
                ) : null}

                <div className="screening-chip-group">
                  {(selectedScreening.symptoms ?? []).length ? (
                    selectedScreening.symptoms.map((symptom) => (
                      <span key={symptom} className="detail-chip">
                        {formatListLabel(symptom)}
                      </span>
                    ))
                  ) : (
                    <span className="muted-copy">Sem sintomas estruturados informados.</span>
                  )}
                </div>

                <div className="section-divider">
                  <h4>Sinais vitais</h4>
                </div>

                <div className="vitals-compact">
                  <div className="info-item">
                    <div className="info-label">Pressao arterial</div>
                    <div className="info-value">
                      {selectedScreening.vitalSigns?.pressaoSistolica ?? '--'}/{selectedScreening.vitalSigns?.pressaoDiastolica ?? '--'} mmHg
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Freq. cardiaca</div>
                    <div className="info-value">{selectedScreening.vitalSigns?.frequenciaCardiaca ?? '--'} bpm</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Freq. respiratoria</div>
                    <div className="info-value">{selectedScreening.vitalSigns?.frequenciaRespiratoria ?? '--'} irpm</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Saturacao O₂</div>
                    <div className="info-value">{selectedScreening.vitalSigns?.saturacaoOxigenio ?? '--'}%</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Temperatura</div>
                    <div className="info-value">{selectedScreening.vitalSigns?.temperatura ?? '--'} °C</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Escala de dor</div>
                    <div className="info-value">{selectedScreening.vitalSigns?.escalaDor ?? '--'}/10</div>
                  </div>
                </div>

                {selectedScreening.status === 'AGUARDANDO_CLASSIFICACAO' ? (
                  <>
                    <div className="section-divider">
                      <h4>Sugestao de classificacao</h4>
                      <p>O motor sugere uma prioridade sem persistir a decisao final ate a validacao do profissional.</p>
                    </div>

                    <div className="action-surface">
                      <button
                        type="button"
                        className={`btn btn-inline ${isSuggesting ? 'is-loading' : ''}`}
                        onClick={handleSuggestClassification}
                        disabled={isSuggesting}
                      >
                        {isSuggesting ? 'Analisando...' : 'Gerar sugestao'}
                      </button>

                      {suggestion ? (
                        <div className="suggestion-card">
                          <div className="detail-badges">
                            <span className={`priority-pill ${PRIORITY_META[suggestion.suggestedPriority]?.className ?? 'info'}`}>
                              {PRIORITY_META[suggestion.suggestedPriority]?.label ?? suggestion.suggestedPriority}
                            </span>
                            <span className="metric-pill">Score {suggestion.score}</span>
                            <span className="metric-pill">Espera maxima {suggestion.maxWaitMinutes} min</span>
                          </div>

                          <ul className="detail-list">
                            {suggestion.reasons?.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    <div className="section-divider">
                      <h4>Validar classificacao final</h4>
                      <p>Se a prioridade final divergir da sugerida, a justificativa se torna obrigatoria no backend.</p>
                    </div>

                    <form className="inline-form" onSubmit={handleValidateClassification}>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="classificationProfessionalId">ID do profissional</label>
                          <input
                            id="classificationProfessionalId"
                            name="professionalId"
                            type="text"
                            value={classificationForm.professionalId}
                            onChange={handleClassificationFieldChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="finalPriority">Prioridade final</label>
                          <select
                            id="finalPriority"
                            name="finalPriority"
                            value={classificationForm.finalPriority}
                            onChange={handleClassificationFieldChange}
                          >
                            <option value="">Usar sugestao automatica</option>
                            {PRIORITY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="overrideJustification">Justificativa de sobrescrita</label>
                        <textarea
                          id="overrideJustification"
                          name="overrideJustification"
                          rows={3}
                          value={classificationForm.overrideJustification}
                          onChange={handleClassificationFieldChange}
                          placeholder="Preencha quando a prioridade final for diferente da sugerida."
                        />
                      </div>

                      <button type="submit" className={`btn ${isActionLoading ? 'is-loading' : ''}`} disabled={isActionLoading}>
                        {isActionLoading ? 'Salvando classificacao...' : 'Confirmar classificacao'}
                      </button>
                    </form>
                  </>
                ) : null}

                {selectedScreening.status === 'CLASSIFICADA' ? (
                  <>
                    <div className="section-divider">
                      <h4>Encaminhar paciente</h4>
                      <p>Voce pode informar o setor manualmente ou deixar o motor de roteamento decidir o destino.</p>
                    </div>

                    <form className="inline-form" onSubmit={handleRouteScreening}>
                      <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="routingProfessionalId">ID do profissional</label>
                        <input
                          id="routingProfessionalId"
                          name="professionalId"
                          type="text"
                          value={routingForm.professionalId}
                          onChange={handleRoutingFieldChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="destinationSector">Setor de destino</label>
                        <select
                          id="destinationSector"
                          name="destinationSector"
                          value={routingForm.destinationSector}
                          onChange={handleRoutingFieldChange}
                        >
                          <option value="">Definir automaticamente</option>
                          {DESTINATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="routingNotes">Observacoes de encaminhamento</label>
                      <textarea
                        id="routingNotes"
                        name="routingNotes"
                        rows={3}
                        value={routingForm.routingNotes}
                        onChange={handleRoutingFieldChange}
                      />
                    </div>

                      <button type="submit" className={`btn ${isActionLoading ? 'is-loading' : ''}`} disabled={isActionLoading}>
                        {isActionLoading ? 'Encaminhando...' : 'Encaminhar paciente'}
                      </button>
                    </form>
                  </>
                ) : null}

                {selectedScreening.status === 'AGUARDANDO_ATENDIMENTO' ? (
                  <>
                    <div className="section-divider">
                      <h4>Fila de atendimento</h4>
                      <p>Esta triagem ja entrou na fila do setor de destino. Inicie o atendimento quando o paciente for chamado.</p>
                    </div>

                    <div className="vitals-compact">
                      <div className="info-item">
                        <div className="info-label">Setor de destino</div>
                        <div className="info-value">{formatListLabel(selectedScreening.destinationSector)}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Encaminhada em</div>
                        <div className="info-value">{formatDateTime(selectedScreening.routedAt)}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Posicao na fila</div>
                        <div className="info-value">{selectedScreening.queueMetrics?.queuePosition ?? '--'}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Tempo restante</div>
                        <div className="info-value">{selectedScreening.queueMetrics?.remainingMinutes ?? '--'} min</div>
                      </div>
                    </div>

                    <div className="section-divider">
                      <h4>Iniciar atendimento</h4>
                      <p>Registre o inicio do atendimento quando o paciente entrar no consultorio.</p>
                    </div>

                    <form className="inline-form" onSubmit={handleStartAttendance}>
                      <div className="form-group">
                        <label htmlFor="attendanceProfessionalId">ID do profissional atendente</label>
                        <input
                          id="attendanceProfessionalId"
                          type="text"
                          value={attendanceForm.professionalId}
                          onChange={(e) => setAttendanceForm((prev) => ({ ...prev, professionalId: e.target.value }))}
                          required
                        />
                      </div>
                      <button type="submit" className={`btn ${isActionLoading ? 'is-loading' : ''}`} disabled={isActionLoading}>
                        {isActionLoading ? 'Iniciando...' : 'Iniciar atendimento'}
                      </button>
                    </form>
                  </>
                ) : null}

                {selectedScreening.status === 'EM_ATENDIMENTO' ? (
                  <>
                    <div className="section-divider">
                      <h4>Atendimento em andamento</h4>
                      <p>O paciente esta sendo atendido. Finalize quando a consulta for encerrada.</p>
                    </div>

                    <div className="vitals-compact">
                      <div className="info-item">
                        <div className="info-label">Setor</div>
                        <div className="info-value">{formatListLabel(selectedScreening.destinationSector)}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Iniciado em</div>
                        <div className="info-value">{formatDateTime(selectedScreening.startedAt)}</div>
                      </div>
                    </div>

                    <div className="section-divider">
                      <h4>Finalizar atendimento</h4>
                      <p>Registre a conclusao do atendimento. O campo de observacoes e opcional.</p>
                    </div>

                    <form className="inline-form" onSubmit={handleFinishAttendance}>
                      <div className="form-group">
                        <label htmlFor="finishProfessionalId">ID do profissional</label>
                        <input
                          id="finishProfessionalId"
                          type="text"
                          value={attendanceForm.professionalId}
                          onChange={(e) => setAttendanceForm((prev) => ({ ...prev, professionalId: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="finishNotes">Observacoes de encerramento</label>
                        <textarea
                          id="finishNotes"
                          rows={3}
                          value={attendanceForm.notes}
                          onChange={(e) => setAttendanceForm((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Opcional"
                        />
                      </div>
                      <button type="submit" className={`btn ${isActionLoading ? 'is-loading' : ''}`} disabled={isActionLoading}>
                        {isActionLoading ? 'Finalizando...' : 'Finalizar atendimento'}
                      </button>
                    </form>
                  </>
                ) : null}

                {selectedScreening.status === 'FINALIZADA' ? (
                  <>
                    <div className="section-divider">
                      <h4>Atendimento finalizado</h4>
                      <p>Esta triagem foi concluida com sucesso. Nenhuma acao adicional e necessaria.</p>
                    </div>
                    <div className="vitals-compact">
                      <div className="info-item">
                        <div className="info-label">Setor</div>
                        <div className="info-value">{formatListLabel(selectedScreening.destinationSector)}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Inicio</div>
                        <div className="info-value">{formatDateTime(selectedScreening.startedAt)}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Encerramento</div>
                        <div className="info-value">{formatDateTime(selectedScreening.finishedAt)}</div>
                      </div>
                    </div>
                  </>
                ) : null}

                {(selectedScreening.status === 'CANCELADA' || selectedScreening.status === 'AUSENTE') ? (
                  <>
                    <div className="section-divider">
                      <h4>{selectedScreening.status === 'AUSENTE' ? 'Paciente ausente' : 'Triagem cancelada'}</h4>
                      <p>Esta triagem foi encerrada sem atendimento.</p>
                    </div>
                    <div className="vitals-compact">
                      <div className="info-item">
                        <div className="info-label">Motivo</div>
                        <div className="info-value">{selectedScreening.cancellationReason || '--'}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Encerrada em</div>
                        <div className="info-value">{formatDateTime(selectedScreening.finishedAt)}</div>
                      </div>
                    </div>
                  </>
                ) : null}

                {['AGUARDANDO_CLASSIFICACAO', 'CLASSIFICADA', 'AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO'].includes(selectedScreening.status) ? (
                  <>
                    <div className="section-divider">
                      <h4>Cancelar / Registrar ausencia</h4>
                      <p>Use para encerrar a triagem sem atendimento. Marque "ausente" se o paciente foi chamado mas nao compareceu.</p>
                    </div>

                    <form className="inline-form" onSubmit={handleCancelScreening}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="cancelProfessionalId">ID do profissional</label>
                        <input
                          id="cancelProfessionalId"
                          type="text"
                          value={cancelForm.professionalId}
                          onChange={(e) => setCancelForm((prev) => ({ ...prev, professionalId: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                        <label className="check-chip">
                          <input
                            type="checkbox"
                            checked={cancelForm.absent}
                            onChange={(e) => setCancelForm((prev) => ({ ...prev, absent: e.target.checked }))}
                          />
                          <span>Paciente ausente</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="cancelReason">Motivo</label>
                      <textarea
                        id="cancelReason"
                        rows={2}
                        value={cancelForm.reason}
                        onChange={(e) => setCancelForm((prev) => ({ ...prev, reason: e.target.value }))}
                        placeholder="Descreva o motivo do cancelamento ou ausencia"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className={`btn btn-secondary ${isActionLoading ? 'is-loading' : ''}`}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? 'Processando...' : cancelForm.absent ? 'Registrar ausencia' : 'Cancelar triagem'}
                    </button>
                    </form>
                  </>
                ) : null}
              </>
            )}
          </section>
        </div>
      </section>

      <ScreeningFormModal
        isOpen={isCreateModalOpen}
        formData={screeningForm}
        patients={patients}
        isSaving={isSavingScreening}
        error={createError}
        onClose={closeCreateModal}
        onSubmit={handleCreateScreening}
        onChange={handleScreeningFormChange}
        onVitalChange={handleVitalChange}
        onToggleSymptom={handleToggleSymptom}
      />
    </DashboardLayout>
  );
};

export default ScreeningManagementPage;
