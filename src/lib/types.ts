
export type WithdrawnBy = 'Municipal' | 'UBS REDENTOR' | 'RETIRADO' | 'CEAM' | 'SANTO ANTONIO';

export type Exam = {
  id: string;
  patientName: string;
  result?: string; // URL to PDF or Google Drive link
  observations?: string;
  receivedDate?: string; // ISO 8601 format string
  withdrawnBy?: WithdrawnBy;
};
