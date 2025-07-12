export type DocumentType = 'snapshot' | 'opLog';

export type Document<T> = {
  type: DocumentType;
  timestamp: string;
  correlationId?: string;
  data: T;
};
