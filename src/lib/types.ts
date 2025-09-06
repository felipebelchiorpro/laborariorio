export type ExamDestination = 'Laboratório Central' | 'Clínica Parceira' | 'Centro de Pesquisa' | 'São João';

export type WithdrawnBy = 'Municipal' | 'UBS REDENTOR' | 'RETIRADO' | 'CEAM' | 'SANTO ANTONIO';

export type Exam = {
  id: string;
  patientName: string;
  collectionDate: string; // ISO 8601 format string
  destination: ExamDestination;
  result?: string; // URL to PDF or Google Drive link
  observations?: string;
  receivedDate?: string; // ISO 8601 format string
  withdrawnBy?: WithdrawnBy;
};
