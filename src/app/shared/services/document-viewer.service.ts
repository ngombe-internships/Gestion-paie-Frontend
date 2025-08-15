import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DocumentViewerData {
  url: string;
  nom: string;
  type: string;
  taille: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentViewerService {
  private documentSubject = new BehaviorSubject<DocumentViewerData | null>(null);
  public document$ = this.documentSubject.asObservable();

  private showModalSubject = new BehaviorSubject<boolean>(false);
  public showModal$ = this.showModalSubject.asObservable();

  constructor() {}

  openDocument(document: DocumentViewerData): void {
    this.documentSubject.next(document);
    this.showModalSubject.next(true);
  }

  closeModal(): void {
    this.showModalSubject.next(false);
    // Attendre la fermeture de l'animation avant de nettoyer
    setTimeout(() => {
      this.documentSubject.next(null);
    }, 300);
  }

  isImage(fileName: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const extension = this.getFileExtension(fileName);
    return imageExtensions.includes(extension);
  }

  isPdf(fileName: string): boolean {
    const extension = this.getFileExtension(fileName);
    return extension === 'pdf';
  }

  isViewable(fileName: string): boolean {
    return this.isImage(fileName) || this.isPdf(fileName);
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  getFileIcon(fileName: string): string {
    const extension = this.getFileExtension(fileName);

    switch (extension) {
      case 'pdf': return 'bi-file-pdf text-danger';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp': return 'bi-file-image text-primary';
      case 'doc':
      case 'docx': return 'bi-file-word text-primary';
      case 'xls':
      case 'xlsx': return 'bi-file-excel text-success';
      case 'txt': return 'bi-file-text text-secondary';
      case 'zip':
      case 'rar': return 'bi-file-zip text-warning';
      default: return 'bi-file-earmark text-muted';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
