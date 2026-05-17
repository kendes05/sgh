#!/usr/bin/env bash
# =============================================================================
# SGH — Script de Seed para Demo
# =============================================================================
# Pré-requisito: todos os serviços rodando (docker-compose up -d)
# Uso: bash seed.sh
#
# O script chama os serviços DIRETAMENTE (bypass do gateway) e injeta o header
# X-User-Role para simular a autorização propagada pelo gateway.
# =============================================================================

set -euo pipefail

# ── Cores ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${YELLOW}[SEED]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}   $*"; }
fail()  { echo -e "${RED}[ERRO]${NC} $*"; exit 1; }

# ── URLs dos serviços ─────────────────────────────────────────────────────────
AUTH="http://localhost:8080/auth"
PATIENTS="http://localhost:8081/patients"
DOCTORS="http://localhost:8083/doctor"
SCREENINGS="http://localhost:8084/screenings"
RECORDS="http://localhost:8085/medical-records"

# ── Helper: POST com header de role ──────────────────────────────────────────
post() {
  local url=$1 role=$2 body=$3
  curl -sf -X POST "$url" \
    -H "Content-Type: application/json" \
    -H "X-User-Role: $role" \
    -d "$body"
}

# ── Verificação de dependências ───────────────────────────────────────────────
command -v curl >/dev/null 2>&1 || fail "curl nao encontrado. Instale o curl e tente novamente."
command -v jq   >/dev/null 2>&1 || { echo -e "${YELLOW}[AVISO]${NC} jq nao encontrado — usando grep/sed para extrair IDs."; JQ=false; }
JQ=${JQ:-true}

extract() {
  local json=$1 key=$2
  if [ "$JQ" = true ]; then
    echo "$json" | jq -r ".$key"
  else
    # grep -o básico + cut: funciona em Linux, macOS e Git Bash no Windows
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
  fi
}

# ── Aguarda os serviços subirem ───────────────────────────────────────────────
wait_service() {
  local name=$1 url=$2
  info "Aguardando $name..."
  for i in $(seq 1 20); do
    # Checa o HTTP status code sem -f: qualquer resposta != "000" significa que o serviço está no ar
    # "000" é o código do curl quando não consegue se conectar (connection refused / timeout)
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    if [ -n "$code" ] && [ "$code" != "000" ]; then
      ok "$name disponivel (HTTP $code)"
      return 0
    fi
    sleep 3
  done
  fail "$name nao respondeu apos 60s. Verifique se os containers estao rodando."
}

wait_service "user-service"             "$AUTH/validate"
wait_service "patient-service"          "$PATIENTS"
wait_service "doctor-service"           "$DOCTORS"
wait_service "screening-service"        "$SCREENINGS/hello"
wait_service "medical-records-service"  "$RECORDS/patient/00000000-0000-0000-0000-000000000001"

echo ""
info "========== Iniciando seed de dados de demo =========="
echo ""

# =============================================================================
# 1. CRIAR PROFISSIONAIS
# =============================================================================
info "Criando profissionais de saude..."

NURSE_JSON=$(post "$DOCTORS" "ADMIN" '{
  "nome": "Fernanda Costa",
  "role": "nurse",
  "crmCoren": "COREN-123456",
  "sexo": "FEMININO",
  "email": "fernanda.costa@sgh.demo",
  "telefone": "(85) 98888-0001",
  "especialidadePrincipal": "Enfermagem Geral"
}') || fail "Falha ao criar enfermeira"
NURSE_ID=$(extract "$NURSE_JSON" "id")
ok "Enfermeira criada → ID: $NURSE_ID"

MEDIC1_JSON=$(post "$DOCTORS" "ADMIN" '{
  "nome": "Dr. Carlos Henrique",
  "role": "medic",
  "crmCoren": "CRM-54321",
  "sexo": "MASCULINO",
  "email": "carlos.henrique@sgh.demo",
  "telefone": "(85) 98888-0002",
  "especialidadePrincipal": "Cardiologia"
}') || fail "Falha ao criar medico 1"
MEDIC1_ID=$(extract "$MEDIC1_JSON" "id")
ok "Medico 1 criado → ID: $MEDIC1_ID"

MEDIC2_JSON=$(post "$DOCTORS" "ADMIN" '{
  "nome": "Dra. Ana Beatriz",
  "role": "medic",
  "crmCoren": "CRM-99887",
  "sexo": "FEMININO",
  "email": "ana.beatriz@sgh.demo",
  "telefone": "(85) 98888-0003",
  "especialidadePrincipal": "Clinica Geral"
}') || fail "Falha ao criar medico 2"
MEDIC2_ID=$(extract "$MEDIC2_JSON" "id")
ok "Medico 2 criada → ID: $MEDIC2_ID"

# =============================================================================
# 2. CRIAR PACIENTES
# =============================================================================
info "Criando pacientes..."

P1_JSON=$(post "$PATIENTS" "ADMIN" '{
  "nome": "Joao da Silva",
  "email": "joao.silva@demo.com",
  "cpf": "111.222.333-44",
  "telefone": "(85) 99111-2233",
  "dataNascimento": "1985-03-15",
  "genero": "MASCULINO",
  "tipoSanguineo": "A_POS",
  "susCardNumber": "898001234560001"
}') || fail "Falha ao criar paciente 1"
P1_ID=$(extract "$P1_JSON" "id")
ok "Paciente 1 criado → ID: $P1_ID"

P2_JSON=$(post "$PATIENTS" "ADMIN" '{
  "nome": "Maria Santos",
  "email": "maria.santos@demo.com",
  "cpf": "555.666.777-88",
  "telefone": "(85) 99222-3344",
  "dataNascimento": "1992-07-22",
  "genero": "FEMININO",
  "tipoSanguineo": "O_NEG",
  "susCardNumber": "898001234560002"
}') || fail "Falha ao criar paciente 2"
P2_ID=$(extract "$P2_JSON" "id")
ok "Paciente 2 criada → ID: $P2_ID"

P3_JSON=$(post "$PATIENTS" "ADMIN" '{
  "nome": "Pedro Oliveira",
  "email": "pedro.oliveira@demo.com",
  "cpf": "999.888.777-66",
  "telefone": "(85) 99333-4455",
  "dataNascimento": "1950-11-08",
  "genero": "MASCULINO",
  "tipoSanguineo": "B_POS",
  "susCardNumber": "898001234560003"
}') || fail "Falha ao criar paciente 3"
P3_ID=$(extract "$P3_JSON" "id")
ok "Paciente 3 criado → ID: $P3_ID"

# =============================================================================
# 3. CRIAR PRONTUÁRIOS
# =============================================================================
info "Criando prontuarios medicos..."

R1_JSON=$(post "$RECORDS" "MEDIC" "{
  \"idPaciente\": \"$P1_ID\",
  \"patientName\": \"Joao da Silva\",
  \"patientBirthDate\": \"1985-03-15\",
  \"patientEmail\": \"joao.silva@demo.com\"
}") || fail "Falha ao criar prontuario 1"
R1_ID=$(extract "$R1_JSON" "id")
ok "Prontuario 1 criado → ID: $R1_ID"

R2_JSON=$(post "$RECORDS" "MEDIC" "{
  \"idPaciente\": \"$P2_ID\",
  \"patientName\": \"Maria Santos\",
  \"patientBirthDate\": \"1992-07-22\",
  \"patientEmail\": \"maria.santos@demo.com\"
}") || fail "Falha ao criar prontuario 2"
R2_ID=$(extract "$R2_JSON" "id")
ok "Prontuario 2 criado → ID: $R2_ID"

R3_JSON=$(post "$RECORDS" "MEDIC" "{
  \"idPaciente\": \"$P3_ID\",
  \"patientName\": \"Pedro Oliveira\",
  \"patientBirthDate\": \"1950-11-08\",
  \"patientEmail\": \"pedro.oliveira@demo.com\"
}") || fail "Falha ao criar prontuario 3"
R3_ID=$(extract "$R3_JSON" "id")
ok "Prontuario 3 criado → ID: $R3_ID"

# =============================================================================
# 4. CRIAR TRIAGENS
# =============================================================================
info "Criando triagens..."

# --- Triagem 1: Joao — VERMELHO → AGUARDANDO_ATENDIMENTO ---
VITALS_CRITICO='"vitalSigns": {"pressaoSistolica": 180, "pressaoDiastolica": 120, "frequenciaCardiaca": 130, "temperatura": 38.5, "frequenciaRespiratoria": 28, "saturacaoOxigenio": 88, "glicemia": 220, "escalaDor": 9}'

S1_JSON=$(post "$SCREENINGS" "NURSE" "{
  \"patientId\": \"$P1_ID\",
  \"patientName\": \"Joao da Silva\",
  \"patientBirthDate\": \"1985-03-15\",
  \"susCardNumber\": \"898001234560001\",
  \"triageProfessionalId\": \"$NURSE_ID\",
  \"mainComplaint\": \"Dor no peito intensa com irradiacao para o braco esquerdo ha 30 minutos\",
  \"symptoms\": [\"DOR_NO_PEITO\", \"FALTA_DE_AR\", \"PALPITACOES\"],
  \"complementarySymptoms\": \"Sudorese fria e sensacao de mal-estar geral\",
  \"comorbidities\": [\"Hipertensao arterial\", \"Diabetes tipo 2\"],
  \"medicationsInUse\": [\"Losartana 50mg\", \"Metformina 500mg\"],
  $VITALS_CRITICO
}") || fail "Falha ao criar triagem 1"
S1_ID=$(extract "$S1_JSON" "id")
ok "Triagem 1 criada → ID: $S1_ID"

post "$SCREENINGS/$S1_ID/classification/suggestion" "NURSE" '{}' >/dev/null
post "$SCREENINGS/$S1_ID/classification" "NURSE" "{
  \"professionalId\": \"$NURSE_ID\",
  \"finalPriority\": \"VERMELHO\",
  \"overrideJustification\": \"Quadro compativel com sindrome coronariana aguda\"
}" >/dev/null
post "$SCREENINGS/$S1_ID/routing" "NURSE" "{
  \"professionalId\": \"$NURSE_ID\",
  \"destinationSector\": \"SALA_EMERGENCIA\",
  \"routingNotes\": \"Encaminhado imediatamente para sala de emergencia\"
}" >/dev/null
ok "Triagem 1 → VERMELHO / AGUARDANDO_ATENDIMENTO / SALA_EMERGENCIA"

# --- Triagem 2: Maria — AMARELO → EM_ATENDIMENTO ---
VITALS_MODERADO='"vitalSigns": {"pressaoSistolica": 140, "pressaoDiastolica": 90, "frequenciaCardiaca": 95, "temperatura": 37.8, "frequenciaRespiratoria": 20, "saturacaoOxigenio": 96, "escalaDor": 6}'

S2_JSON=$(post "$SCREENINGS" "NURSE" "{
  \"patientId\": \"$P2_ID\",
  \"patientName\": \"Maria Santos\",
  \"patientBirthDate\": \"1992-07-22\",
  \"susCardNumber\": \"898001234560002\",
  \"triageProfessionalId\": \"$NURSE_ID\",
  \"mainComplaint\": \"Cefaleia intensa e tontura ha 2 horas, sem melhora com analgesico\",
  \"symptoms\": [\"CEFALEIA\", \"TONTURA\", \"NAUSEA\"],
  \"allergies\": [\"Dipirona\"],
  $VITALS_MODERADO
}") || fail "Falha ao criar triagem 2"
S2_ID=$(extract "$S2_JSON" "id")
ok "Triagem 2 criada → ID: $S2_ID"

post "$SCREENINGS/$S2_ID/classification/suggestion" "NURSE" '{}' >/dev/null
post "$SCREENINGS/$S2_ID/classification" "NURSE" "{
  \"professionalId\": \"$NURSE_ID\",
  \"finalPriority\": \"AMARELO\"
}" >/dev/null
post "$SCREENINGS/$S2_ID/routing" "NURSE" "{
  \"professionalId\": \"$NURSE_ID\",
  \"destinationSector\": \"CONSULTORIO_CLINICA_GERAL\"
}" >/dev/null
post "$SCREENINGS/$S2_ID/attendance/start" "MEDIC" "{
  \"professionalId\": \"$MEDIC2_ID\"
}" >/dev/null
ok "Triagem 2 → AMARELO / EM_ATENDIMENTO / CONSULTORIO_CLINICA_GERAL"

# --- Triagem 3: Pedro — VERDE → FINALIZADA ---
VITALS_LEVE='"vitalSigns": {"pressaoSistolica": 125, "pressaoDiastolica": 82, "frequenciaCardiaca": 78, "temperatura": 36.8, "frequenciaRespiratoria": 16, "saturacaoOxigenio": 98, "escalaDor": 3}'

S3_JSON=$(post "$SCREENINGS" "NURSE" "{
  \"patientId\": \"$P3_ID\",
  \"patientName\": \"Pedro Oliveira\",
  \"patientBirthDate\": \"1950-11-08\",
  \"susCardNumber\": \"898001234560003\",
  \"triageProfessionalId\": \"$NURSE_ID\",
  \"mainComplaint\": \"Tosse seca ha 3 dias, sem febre\",
  \"symptoms\": [\"TOSSE\"],
  \"comorbidities\": [\"Asma\"],
  $VITALS_LEVE
}") || fail "Falha ao criar triagem 3"
S3_ID=$(extract "$S3_JSON" "id")
ok "Triagem 3 criada → ID: $S3_ID"

post "$SCREENINGS/$S3_ID/classification/suggestion" "NURSE" '{}' >/dev/null
post "$SCREENINGS/$S3_ID/classification" "NURSE" "{
  \"professionalId\": \"$NURSE_ID\",
  \"finalPriority\": \"VERDE\"
}" >/dev/null
post "$SCREENINGS/$S3_ID/routing" "NURSE" "{
  \"professionalId\": \"$NURSE_ID\",
  \"destinationSector\": \"CONSULTORIO_CLINICA_GERAL\"
}" >/dev/null
post "$SCREENINGS/$S3_ID/attendance/start" "MEDIC" "{
  \"professionalId\": \"$MEDIC1_ID\"
}" >/dev/null
post "$SCREENINGS/$S3_ID/attendance/finish" "MEDIC" "{
  \"professionalId\": \"$MEDIC1_ID\",
  \"dischargeNotes\": \"Paciente orientado sobre uso de broncodilatador. Alta com prescricao.\"
}" >/dev/null
ok "Triagem 3 → VERDE / FINALIZADA / CONSULTORIO_CLINICA_GERAL"

# =============================================================================
# 5. DADOS CLÍNICOS NO PRONTUÁRIO
# =============================================================================
info "Adicionando dados clinicos nos prontuarios..."

# Consulta de emergência para João
post "$RECORDS/$R1_ID/appointments" "MEDIC" "{
  \"doctorId\": \"$MEDIC1_ID\",
  \"appointmentDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S)\",
  \"type\": \"EMERGENCIA\",
  \"clinicalNotes\": \"Paciente admitido em quadro de dor toracica tipica. ECG com supra de ST em V1-V4. Encaminhado para hemodinamica. Prescrito AAS 300mg, Heparina e Nitroglicerina SL.\",
  \"screeningId\": \"$S1_ID\",
  \"cid10\": \"I21.0\"
}" >/dev/null
ok "Consulta de emergencia adicionada ao prontuario de Joao"

# Medicamento para João
post "$RECORDS/$R1_ID/medications" "MEDIC" "{
  \"name\": \"AAS\",
  \"dosage\": \"100mg\",
  \"frequency\": \"1x ao dia\",
  \"startDate\": \"$(date -u +%Y-%m-%d)\",
  \"duration\": \"Uso continuo\",
  \"prescribedBy\": \"$MEDIC1_ID\",
  \"notes\": \"Antiagregante plaquetario pos-IAM\"
}" >/dev/null
ok "Medicamento adicionado ao prontuario de Joao"

# Exame para João
post "$RECORDS/$R1_ID/exams" "MEDIC" "{
  \"type\": \"Eletrocardiograma\",
  \"performedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%S)\",
  \"result\": \"Supra de ST em V1-V4 compativel com IAM anterior. Encaminhado para cineangiocoronariografia de urgencia.\",
  \"requestedBy\": \"$MEDIC1_ID\"
}" >/dev/null
ok "Exame adicionado ao prontuario de Joao"

# Consulta para Maria
post "$RECORDS/$R2_ID/appointments" "MEDIC" "{
  \"doctorId\": \"$MEDIC2_ID\",
  \"appointmentDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S)\",
  \"type\": \"CONSULTA\",
  \"clinicalNotes\": \"Paciente refere cefaleia pulsatil intensa, sem deficit neurologico. PA 140x90mmHg. Hipotese diagnostica: enxaqueca com aura. Prescrito analgesia e orientacao de repouso.\",
  \"screeningId\": \"$S2_ID\",
  \"cid10\": \"G43.1\"
}" >/dev/null
ok "Consulta adicionada ao prontuario de Maria"

# Medicamento para Maria
post "$RECORDS/$R2_ID/medications" "MEDIC" "{
  \"name\": \"Sumatriptana\",
  \"dosage\": \"50mg\",
  \"frequency\": \"Uso na crise\",
  \"startDate\": \"$(date -u +%Y-%m-%d)\",
  \"duration\": \"Conforme necessidade\",
  \"prescribedBy\": \"$MEDIC2_ID\",
  \"notes\": \"Triptano para crises de enxaqueca. Evitar em pacientes com HAS nao controlada.\"
}" >/dev/null
ok "Medicamento adicionado ao prontuario de Maria"

# Consulta e exame para Pedro
post "$RECORDS/$R3_ID/appointments" "MEDIC" "{
  \"doctorId\": \"$MEDIC1_ID\",
  \"appointmentDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S)\",
  \"type\": \"CONSULTA\",
  \"clinicalNotes\": \"Paciente asmatico com tosse seca. Ausculta com leve sibilancia bilateral. Prescrito salbutamol spray e orientacoes. Alta com retorno em 7 dias se nao melhorar.\",
  \"screeningId\": \"$S3_ID\",
  \"cid10\": \"J45.0\"
}" >/dev/null

post "$RECORDS/$R3_ID/medications" "MEDIC" "{
  \"name\": \"Salbutamol\",
  \"dosage\": \"100mcg/dose\",
  \"frequency\": \"2 jatos a cada 4-6h se necessario\",
  \"startDate\": \"$(date -u +%Y-%m-%d)\",
  \"duration\": \"7 dias\",
  \"prescribedBy\": \"$MEDIC1_ID\"
}" >/dev/null

post "$RECORDS/$R3_ID/exams" "MEDIC" "{
  \"type\": \"Espirometria\",
  \"performedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%S)\",
  \"result\": \"VEF1/CVF = 68% (abaixo do previsto). Padrao obstrutivo leve. Compativel com asma.\",
  \"requestedBy\": \"$MEDIC1_ID\"
}" >/dev/null
ok "Dados clinicos adicionados ao prontuario de Pedro"

# =============================================================================
# RESUMO FINAL
# =============================================================================
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SEED CONCLUIDO COM SUCESSO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Profissionais criados:"
echo "    Enfermeira  → Fernanda Costa   ($NURSE_ID)"
echo "    Medico 1    → Dr. Carlos       ($MEDIC1_ID)"
echo "    Medico 2    → Dra. Ana Beatriz ($MEDIC2_ID)"
echo ""
echo "  Pacientes criados:"
echo "    Joao da Silva  → $P1_ID"
echo "    Maria Santos   → $P2_ID"
echo "    Pedro Oliveira → $P3_ID"
echo ""
echo "  Triagens:"
echo "    S1 Joao  → VERMELHO / AGUARDANDO_ATENDIMENTO / SALA_EMERGENCIA"
echo "    S2 Maria → AMARELO  / EM_ATENDIMENTO         / CONSULTORIO_CLINICA_GERAL"
echo "    S3 Pedro → VERDE    / FINALIZADA              / CONSULTORIO_CLINICA_GERAL"
echo ""
echo "  Prontuarios com consultas, medicamentos e exames criados."
echo ""
echo -e "  Acesse via gateway: ${YELLOW}http://localhost:8082${NC}"
echo ""
