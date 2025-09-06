export type ExamStatus = 'Pendente' | 'Em Análise' | 'Concluído' | 'Entregue';

export type ExamType = 'Exame de Sangue' | 'Urinálise' | 'Ressonância Magnética' | 'Raio-X' | 'Biópsia';

export type ExamDestination = 'Laboratório Central' | 'Clínica Parceira' | 'Centro de Pesquisa';

export type Exam = {
  id: string;
  patientName: string;
  patientId: string;
  patientDob: string; // ISO 8601 format string
  examType: ExamType;
  collectionDate: string; // ISO 8601 format string
  status: ExamStatus;
  destination: ExamDestination;
  result?: string; // URL to PDF or Google Drive link
};
