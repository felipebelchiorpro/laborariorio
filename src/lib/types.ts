export type ExamStatus = 'Pending' | 'In Analysis' | 'Completed' | 'Delivered';

export type ExamType = 'Blood Test' | 'Urinalysis' | 'MRI Scan' | 'X-Ray' | 'Biopsy';

export type Exam = {
  id: string;
  patientName: string;
  patientId: string;
  patientDob: string; // ISO 8601 format string
  examType: ExamType;
  collectionDate: string; // ISO 8601 format string
  status: ExamStatus;
  result?: string; // URL to PDF or Google Drive link
};
