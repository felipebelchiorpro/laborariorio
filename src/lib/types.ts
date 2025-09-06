export type ExamDestination = 'Laboratório Central' | 'Clínica Parceira' | 'Centro de Pesquisa' | 'São João';

export type Exam = {
  id: string;
  patientName: string;
  patientId?: string; // Tornando opcional para não quebrar dados existentes
  patientDob?: string; // Tornando opcional para não quebrar dados existentes
  collectionDate: string; // ISO 8601 format string
  destination: ExamDestination;
  result?: string; // URL to PDF or Google Drive link
  observations?: string;
  receivedDate?: string; // ISO 8601 format string
  withdrawnBy?: string;
  department?: string;
};
