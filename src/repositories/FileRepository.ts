import fs from 'fs';
import path from 'path';
import { FileMetadata } from '../models/FileMetadata.js';

export class FileRepository {
  private dbPath: string;

  constructor(dbPath: string = './data/files.json') {
    this.dbPath = dbPath;
    this.ensureDbExists();
  }

  private ensureDbExists(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private readDb(): FileMetadata[] {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(data) as FileMetadata[];
    } catch (error) {
      console.error('Error reading file database:', error);
      return [];
    }
  }

  private writeDb(data: FileMetadata[]): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing file database:', error);
    }
  }

  save(metadata: FileMetadata): void {
    const data = this.readDb();
    data.push(metadata);
    this.writeDb(data);
  }

  getAll(): FileMetadata[] {
    return this.readDb();
  }

  getById(id: string): FileMetadata | undefined {
    return this.readDb().find(file => file.id === id);
  }
}
