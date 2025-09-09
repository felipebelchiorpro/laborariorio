
export type Exam = {
  id: string; // Gerado a partir do número da linha
  rowNumber: number; // Número da linha na planilha
  patientName: string;
  observations?: string;
  receivedDate?: string; // ISO 8601 format string
  withdrawnBy?: string;
};
