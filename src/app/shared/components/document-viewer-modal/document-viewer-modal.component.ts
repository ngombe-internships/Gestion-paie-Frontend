import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DocumentViewerService, DocumentViewerData } from './services/document-viewer.service';

@Component({
  selector: 'app-document-viewer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-viewer-modal.component.html',
  styleUrls: ['./document-viewer-modal.component.css']
})
export class DocumentViewerModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private documentViewerService = inject(DocumentViewerService)
  showModal = false;
  document: DocumentViewerData | null = null;
  isLoading = true;
  hasError = false;

  ngOnInit(): void {
    // Écouter les changements de modal
    this.documentViewerService.showModal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(show => {
        this.showModal = show;
        if (show) {
          this.isLoading = true;
          this.hasError = false;
          document.body.style.overflow = 'hidden'; // Empêcher le scroll
        } else {
          document.body.style.overflow = ''; // Restaurer le scroll
        }
      });

    // Écouter les changements de document
    this.documentViewerService.document$
      .pipe(takeUntil(this.destroy$))
      .subscribe(doc => {
        this.document = doc;
        if (doc) {
          this.isLoading = true;
          this.hasError = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = ''; // Nettoyer
  }

  closeModal(): void {
    this.documentViewerService.closeModal();
  }

  isImage(): boolean {
    return this.document ? this.documentViewerService.isImage(this.document.nom) : false;
  }

  isPdf(): boolean {
    return this.document ? this.documentViewerService.isPdf(this.document.nom) : false;
  }

  isViewable(): boolean {
    return this.document ? this.documentViewerService.isViewable(this.document.nom) : false;
  }

  getFileIcon(): string {
    return this.document ? this.documentViewerService.getFileIcon(this.document.nom) : 'bi-file-earmark';
  }

  formatFileSize(bytes: number): string {
    return this.documentViewerService.formatFileSize(bytes);
  }

  getFileType(): string {
    if (!this.document) return '';
    const extension = this.document.nom.split('.').pop()?.toUpperCase();
    return extension ? `Fichier ${extension}` : 'Fichier';
  }

  getPdfUrl(): string {
    if (!this.document) return '';
    // Ajouter #toolbar=0 pour masquer la barre d'outils du PDF
    return `${this.document.url}#toolbar=0&navpanes=0&scrollbar=0`;
  }

  showFooter(): boolean {
    return !this.isViewable() || this.hasError;
  }

  // Gestionnaires d'événements
  onImageLoad(): void {
    this.isLoading = false;
    this.hasError = false;
  }

  onImageError(): void {
    this.isLoading = false;
    this.hasError = true;
  }

  onPdfLoad(): void {
    this.isLoading = false;
    this.hasError = false;
  }

  onPdfError(): void {
    this.isLoading = false;
    this.hasError = true;
  }

  retryLoad(): void {
    this.isLoading = true;
    this.hasError = false;
    // Forcer le rechargement en ajoutant un timestamp
    if (this.document) {
      const url = this.document.url;
      const separator = url.includes('?') ? '&' : '?';
      this.document.url = `${url}${separator}t=${Date.now()}`;
    }
  }

  downloadDocument(): void {
    if (!this.document) return;

    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = this.document.url;
    link.download = this.document.nom;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openInNewTab(): void {
    if (!this.document) return;

    const newWindow = window.open();
    if (newWindow) {
      newWindow.opener = null; // Sécurité
      newWindow.location.href = this.document.url;
    }
  }
}
