import type { Exam, WithdrawnBy } from './types';

export const exams: Exam[] = [
  {
    id: 'EXM001',
    patientName: 'João da Silva',
    result: 'https://example.com/results/joaosilva.pdf',
    observations: 'Paciente em jejum de 8 horas.',
    receivedDate: '2024-09-04T12:00:00.000Z',
    withdrawnBy: 'Municipal',
  },
  {
    id: 'EXM002',
    patientName: 'Maria Oliveira',
    observations: 'Uso de contraste.',
    withdrawnBy: 'UBS REDENTOR',
  },
  {
    id: 'EXM003',
    patientName: 'Alice Johnson',
    withdrawnBy: 'RETIRADO',
  },
  {
    id: 'EXM004',
    patientName: 'Robert Brown',
    result: 'https://example.com/results/robertbrown.pdf',
    receivedDate: '2024-09-01T12:00:00.000Z',
    withdrawnBy: 'CEAM',
  },
  {
    id: 'EXM005',
    patientName: 'Emily Davis',
  },
  {
    id: 'EXM006',
    patientName: 'Michael Wilson',
    observations: 'Amostra enviada para análise patológica.',
    withdrawnBy: 'SANTO ANTONIO',
  },
  {
    id: 'EXM007',
    patientName: 'Sarah Miller',
    result: 'https://example.com/results/sarahmiller.pdf',
    receivedDate: '2024-09-03T12:00:00.000Z',
    withdrawnBy: 'RETIRADO',
  },
  {
    id: 'EXM008',
    patientName: 'David Martinez',
    withdrawnBy: 'Municipal',
  },
  {
    id: 'EXM009',
    patientName: 'Laura Garcia',
    withdrawnBy: 'RETIRADO',
  },
  {
    id: 'EXM010',
    patientName: 'James Rodriguez',
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
