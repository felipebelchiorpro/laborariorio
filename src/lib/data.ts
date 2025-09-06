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
    receivedDate: '2024-09-05T12:00:00.000Z',
    withdrawnBy: 'UBS REDENTOR',
  },
  {
    id: 'EXM003',
    patientName: 'Alice Johnson',
    receivedDate: '2024-09-06T12:00:00.000Z',
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
    receivedDate: '2024-09-02T12:00:00.000Z',
  },
  {
    id: 'EXM006',
    patientName: 'Michael Wilson',
    observations: 'Amostra enviada para análise patológica.',
    receivedDate: '2024-09-07T12:00:00.000Z',
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
    receivedDate: '2024-09-08T12:00:00.000Z',
    withdrawnBy: 'Municipal',
  },
  {
    id: 'EXM009',
    patientName: 'Laura Garcia',
    receivedDate: '2024-09-09T12:00:00.000Z',
    withdrawnBy: 'RETIRADO',
  },
  {
    id: 'EXM010',
    patientName: 'James Rodriguez',
    receivedDate: '2024-09-10T12:00:00.000Z',
    withdrawnBy: 'UBS REDENTOR',
  },
];

export const saoJoaoExams: Exam[] = [
    {
        id: 'SJE001',
        patientName: 'Carlos Pereira',
        observations: 'Paciente pediátrico.',
        receivedDate: '2024-09-05T10:00:00.000Z',
        withdrawnBy: 'Municipal',
    },
    {
        id: 'SJE002',
        patientName: 'Fernanda Costa',
        result: 'https://example.com/results/fernandacosta.pdf',
        receivedDate: '2024-09-06T11:30:00.000Z',
        withdrawnBy: 'RETIRADO',
    },
    {
        id: 'SJE003',
        patientName: 'Ricardo Almeida',
        receivedDate: '2024-09-07T14:00:00.000Z',
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
