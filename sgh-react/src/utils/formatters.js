export const formatBirthDate = (value) => {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleDateString('pt-BR');
};

export const formatGender = (value) => {
  const labels = {
    MASCULINO: 'Masculino',
    FEMININO: 'Feminino',
    OUTRO: 'Outro',
  };

  return labels[value] ?? value ?? '--';
};

export const formatSex = (value) => formatGender(value);

export const formatDoctorRole = (value) => {
  const labels = {
    medic: 'Médico(a)',
    nurse: 'Enfermeiro(a)',
  };

  return labels[value] ?? value ?? '--';
};

export const calculateAge = (birthDate) => {
  if (!birthDate) {
    return 0;
  }

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
};
