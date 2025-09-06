import type { Exam, WithdrawnBy } from './types';

export const exams: Exam[] = [
  {
    id: 'EXM001',
    patientName: 'João da Silva',
    destination: 'Laboratório Central',
    result: 'https://example.com/results/joaosilva.pdf',
    observations: 'Paciente em jejum de 8 horas.',
    receivedDate: '2024-09-04T12:00:00.000Z',
    withdrawnBy: 'Municipal',
  },
  {
    id: 'EXM002',
    patientName: 'Maria Oliveira',
    destination: 'São João',
    observations: 'Uso de contraste.',
    withdrawnBy: 'UBS REDENTOR',
  },
  {
    id: 'EXM003',
    patientName: 'Alice Johnson',
    destination: 'Laboratório Central',
    withdrawnBy: 'RETIRADO',
  },
  {
    id: 'EXM004',
    patientName: 'Robert Brown',
    destination: 'Clínica Parceira',
    result: 'https://example.com/results/robertbrown.pdf',
    receivedDate: '2024-09-01T12:00:00.000Z',
    withdrawnBy: 'CEAM',
  },
  {
    id: 'EXM005',
    patientName: 'Emily Davis',
    destination: 'São João',
  },
  {
    id: 'EXM006',
    patientName: 'Michael Wilson',
    destination: 'Centro de Pesquisa',
    observations: 'Amostra enviada para análise patológica.',
    withdrawnBy: 'SANTO ANTONIO',
  },
  {
    id: 'EXM007',
    patientName: 'Sarah Miller',
    destination: 'Laboratório Central',
    result: 'https://example.com/results/sarahmiller.pdf',
    receivedDate: '2024-09-03T12:00:00.000Z',
    withdrawnBy: 'RETIRADO',
  },
  {
    id: 'EXM008',
    patientName: 'David Martinez',
    destination: 'Clínica Parceira',
    withdrawnBy: 'Municipal',
  },
  {
    id: 'EXM009',
    patientName: 'Laura Garcia',
    destination: 'São João',
    withdrawnBy: 'RETIRADO',
  },
  {
    id: 'EXM010',
    patientName: 'James Rodriguez',
    destination: 'Clínica Parceira',
    withdrawnBy: 'UBS REDENTOR',
  },
];

export const withdrawnByOptions: { value: WithdrawnBy; label: string }[] = [
    { value: "Municipal", label: "Municipal" },
    { value: "UBS REDENTOR", label: "UBS REDENTOR" },
    { value: "RETIRADO", label: "RETIRADO" },
    { value: "CEAM", label: "CEAM" },
    { value: "SANTO ANTONIO", label: "SANTO ANTONIO" },
];
