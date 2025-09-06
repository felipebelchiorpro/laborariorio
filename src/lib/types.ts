export type ExamDestination = 'Laboratório Central' | 'Clínica Parceira' | 'Centro de Pesquisa';

export type Exam = {
  id: string;
  patientName: string;
  patientId: string;
  patientDob: string; // ISO 8601 format string
  collectionDate: string; // ISO 8601 format string
  destination: ExamDestination;
  result?: string; // URL to PDF or Google Drive link
  observations?: string;
};
