import { Request } from 'express';

export interface IFileUploadOptions {
  destination?: string;
  filename?: (
    req: Request,
    file: File,
    callback: (error: Error | null, filename: string) => void,
  ) => void;
  limits?: {
    fileSize?: number;
    files?: number;
  };
  fileFilter?: (
    req: Request,
    file: File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => void;
}

export interface IProcessedFile {
  originalName: string;
  filename: string;
  size: number;
  mimeType: string;
  path: string;
  url?: string;
}

export interface IFileUploadResult {
  files: IProcessedFile[];
  success: boolean;
  message?: string;
}

export interface IDiskConfig {
  driver: 's3';
  root?: string;
  cloudfrontUrl?: string;
  visibility?: 'public' | 'private';
  // S3 specific
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface IFileValidationOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  required?: boolean;
}
