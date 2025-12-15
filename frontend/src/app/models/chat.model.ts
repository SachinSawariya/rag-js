export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  ragAnswer: string;
  simpleAnswer: string;
}

export interface FileUploadResponse {
  message: string;
  fileName: string;
  filePath: string;
  size: number;
}

export interface UploadProgressEvent {
  stage: 'start' | 'clearing' | 'chunking' | 'embedding' | 'complete' | 'error';
  current?: number;
  total?: number;
  message: string;
  percentage?: number;
}
