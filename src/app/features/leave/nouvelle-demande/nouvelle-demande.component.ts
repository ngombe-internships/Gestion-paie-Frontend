import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { DemandeCongeCreateDto, TypeConge } from '../models/demande-conge.model';
import { SoldeCongeDto } from '../models/solde-conge.model';
import { AuthService } from '../../../../services/auth.service';
import { EmployeService } from '../../../../services/employe.service';
import { CongeService } from '../../../conges/services/conge.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-nouvelle-demande',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './nouvelle-demande.component.html',
  styleUrls: ['./nouvelle-demande.component.css']
})
export class NouvelleDemandeComponent implements OnInit, OnDestroy {
  demandeForm!: FormGroup;
  isSubmitting = false;
  isLoadingSolde = false;
  solde: SoldeCongeDto | null = null;
  employeId: number | null = null;
  joursOuvrablesSelectionnes = 0;
  selectedFiles: File[] = [];
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
  TypeConge = TypeConge;

  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private congeService = inject(CongeService);
  private toastrService = inject(ToastrService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private employeService = inject(EmployeService);
  private toastService = inject(ToastService);

  get minDateDebut(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadEmployeInfo();
    this.setupFormWatchers();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.demandeForm = this.fb.group({
      typeConge: [TypeConge.CONGE_PAYE, [Validators.required]],
      dateDebut: ['', [Validators.required, this.dateDebutValidator.bind(this)]],
      dateFin: ['', [Validators.required, this.dateFinValidator.bind(this)]],
      raison: [''],
      documentsJustificatifs: [[]]
    });
  }

  private setupFormWatchers(): void {
    this.demandeForm.get('dateDebut')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculerJoursOuvrables();
        this.updateDateFinValidator();
      });

    this.demandeForm.get('dateFin')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculerJoursOuvrables());

    this.demandeForm.get('typeConge')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onTypeCongeChange());
  }

  private updateDateFinValidator(): void {
    const dateFinControl = this.demandeForm.get('dateFin');
    dateFinControl?.updateValueAndValidity();
  }

  private dateDebutValidator(control: AbstractControl) {
    if (!control.value) return null;
    const dateDebut = new Date(control.value);
    const dateMinimum = new Date();
    dateMinimum.setDate(dateMinimum.getDate() + 30);
    dateMinimum.setHours(0, 0, 0, 0);
    if (dateDebut < dateMinimum) {
      return { preavisInsuffisant: true };
    }
    return null;
  }

  private dateFinValidator(control: AbstractControl) {
    if (!control.value || !this.demandeForm) return null;
    const dateDebut = this.demandeForm.get('dateDebut')?.value;
    const dateFin = control.value;
    if (dateDebut && dateFin && new Date(dateFin) < new Date(dateDebut)) {
      return { dateFinInvalide: true };
    }
    return null;
  }

  private loadEmployeInfo(): void {
    this.employeService.getMyEmployeProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employe) => {
          if (employe && employe.id) {
            this.employeId = employe.id;
            this.loadSolde();
          } else {
            this.handleError('Impossible de récupérer vos informations employé.');
          }
        },
        error: () => this.handleError('Impossible de récupérer vos informations employé.')
      });
  }

  private loadSolde(): void {
    this.isLoadingSolde = true;
    this.congeService.getMonSolde()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingSolde = false)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'OK' && response.data) {
            this.solde = response.data;
          } else {
            this.toastrService.warning('Impossible de récupérer votre solde de congés.', 'Attention');
            this.toastService.warning('Impossible de récupérer votre solde de congés.');

          }
        },
        error: () => this.toastService.warning('Impossible de récupérer votre solde de congés.')
      });
  }

  onTypeCongeChange(): void {
    const typeConge = this.demandeForm.get('typeConge')?.value;
      console.log('Type sélectionné:', typeConge);
    this.selectedFiles = [];
    this.updateValidationsByType(typeConge);
  }

  updateValidationsByType(typeConge: TypeConge): void {
    const reasonControl = this.demandeForm.get('raison');
    const documentsControl = this.demandeForm.get('documentsJustificatifs');
    const reasonRequiredTypes = [
      TypeConge.CONGE_MALADIE,
      TypeConge.CONGE_MATERNITE,
      TypeConge.CONGE_PATERNITE,
      TypeConge.CONGE_DEUIL,
      TypeConge.CONGE_FORMATION
    ];
    const documentsRequiredTypes = [
      TypeConge.CONGE_MALADIE,
      TypeConge.CONGE_MATERNITE,
      TypeConge.CONGE_PATERNITE,
      TypeConge.CONGE_DEUIL,
      TypeConge.CONGE_FORMATION
    ];
    if (reasonRequiredTypes.includes(typeConge)) {
      reasonControl?.setValidators([Validators.required]);
    } else {
      reasonControl?.clearValidators();
    }
    reasonControl?.updateValueAndValidity();

    if (documentsRequiredTypes.includes(typeConge)) {
      documentsControl?.setValidators([Validators.required]);
    } else {
      documentsControl?.clearValidators();
    }
    this.updateDocumentsValidation();
  }

  getCurrentTypeConge(): TypeConge | null {
    return this.demandeForm.get('typeConge')?.value || null;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const filesArray = Array.from(input.files);
    const validFiles: File[] = [];
    for (const file of filesArray) {
      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        this.toastrService.warning(validation.message!, 'Fichier rejeté');
        this.toastService.warning(validation.message!);

      }
    }
    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    this.updateDocumentsValidation();
  }

  private validateFile(file: File): { valid: boolean, message?: string } {
    if (file.size > this.maxFileSize) {
      return { valid: false, message: `Le fichier "${file.name}" est trop volumineux (max 5MB)` };
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.allowedExtensions.includes(extension)) {
      return { valid: false, message: `Le fichier "${file.name}" n'est pas dans un format autorisé` };
    }
    return { valid: true };
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.updateDocumentsValidation();
  }

  private updateDocumentsValidation(): void {
    const typeConge = this.demandeForm.get('typeConge')?.value;
    const documentsRequired = this.isDocumentRequired(typeConge);
    const documentsControl = this.demandeForm.get('documentsJustificatifs');
    if (documentsRequired && this.selectedFiles.length === 0) {
      documentsControl?.setErrors({ required: true });
    } else {
      documentsControl?.setErrors(null);
    }
  }

  public isDocumentRequired(typeConge: TypeConge): boolean {
    return [
      TypeConge.CONGE_MALADIE,
      TypeConge.CONGE_MATERNITE,
      TypeConge.CONGE_PATERNITE,
      TypeConge.CONGE_DEUIL,
      TypeConge.CONGE_FORMATION
    ].includes(typeConge);
  }

  isDocumentRequiredForCurrentType(): boolean {
    const typeConge = this.demandeForm.get('typeConge')?.value;
    return typeConge ? this.isDocumentRequired(typeConge) : false;
  }

  calculerJoursOuvrables(): void {
    const dateDebut = this.demandeForm.get('dateDebut')?.value;
    const dateFin = this.demandeForm.get('dateFin')?.value;
    if (dateDebut && dateFin) {
      const validationDates = this.congeService.verifierValiditeDates(dateDebut, dateFin);
      if (!validationDates.valide) {
        this.joursOuvrablesSelectionnes = 0;
        return;
      }
      this.joursOuvrablesSelectionnes = this.congeService.calculerJoursOuvrables(dateDebut, dateFin);
    } else {
      this.joursOuvrablesSelectionnes = 0;
    }
  }

  validerSolde(): { valide: boolean, message?: string } {
    if (!this.solde) {
      return { valide: false, message: 'Solde non disponible' };
    }
    const typeConge = this.demandeForm.get('typeConge')?.value;
    if (this.congeService.typeCongeNeedsSolde(typeConge)) {
      if (this.solde.soldeDisponible < this.joursOuvrablesSelectionnes) {
        return {
          valide: false,
          message: `Solde insuffisant. Disponible: ${this.solde.soldeDisponible} jours, Demandé: ${this.joursOuvrablesSelectionnes} jours`
        };
      }
    }
    return { valide: true };
  }

  // ========== SOUMISSION : CRÉER DEMANDE PUIS UPLOAD DOCUMENTS ==========

 onSubmit(): void {
  if (!this.preValidateForm()) return;

  this.isSubmitting = true;
  const demandeDto = this.prepareDemandeDto();

  this.congeService.creerDemande(demandeDto)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isSubmitting = false)
    )
    .subscribe({
      next: (response) => {
        console.log('Réponse du serveur:', response); // Pour débugger

        // VÉRIFIER PLUSIEURS FORMATS DE RÉPONSE POSSIBLE
        if (this.isSuccessResponse(response)) {
          const demandeId = this.extractDemandeId(response);

          if (this.selectedFiles.length > 0 && demandeId) {
            this.uploadDocuments(demandeId, demandeDto.typeConge);
          } else {
            this.handleSubmitSuccess();
          }
        } else {
          this.handleSubmitError(response);
        }
      },
      error: (error) => {
        console.log('Erreur du serveur:', error); // Pour débugger
        this.handleSubmitError(error);
      }
    });
}

private isSuccessResponse(response: any): boolean {
  // Vérifier différents formats de réponse de succès
  return (
    response && (
      response.status === 'OK' ||
      response.status === 'SUCCESS' ||
      response.success === true ||
      (response.data && response.data.id) ||
      // Si c'est directement l'objet demande créé
      (response.id && response.typeConge)
    )
  );
}

private extractDemandeId(response: any): number | null {
  if (response.data && response.data.id) {
    return response.data.id;
  }
  if (response.id) {
    return response.id;
  }
  return null;
}

 uploadDocuments(demandeId: number, typeConge: TypeConge) {
  const uploads = this.selectedFiles.map(file => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('demandeId', demandeId.toString());
    formData.append('typeDocument', this.getTypeDocumentForConge(typeConge));
    return this.congeService.uploadDocument(formData);
  });

  forkJoin(uploads).subscribe({
    next: (uploadResponses) => {
      console.log('Upload réponses:', uploadResponses); // Pour débugger

      this.toastService.success('Votre demande de congé avec documents a été soumise avec succès!');
      this.resetFormCompletely();
      this.router.navigate(['dashboard/conges/mes-demandes']);
    },
    error: (uploadError) => {
      console.log('Erreur upload:', uploadError); // Pour débugger
      this.toastService.warning('Demande créée avec succès, mais erreur lors de l\'envoi des documents.');
      this.resetFormCompletely();
      this.router.navigate(['dashboard/conges/mes-demandes']);
    }
  });
}

private handleSubmitSuccess(): void {
  this.toastService.success('Votre demande de congé a été soumise avec succès!');
  this.resetFormCompletely();
  this.router.navigate(['dashboard/conges/mes-demandes']);
}

  getTypeDocumentForConge(typeConge: TypeConge): string {
    switch (typeConge) {
      case TypeConge.CONGE_MALADIE: return 'CERTIFICAT_MEDICAL';
      case TypeConge.CONGE_MATERNITE: return 'ACTE_NAISSANCE';
      case TypeConge.CONGE_PATERNITE: return 'ACTE_NAISSANCE';
      case TypeConge.CONGE_DEUIL: return 'ACTE_DECES';
      case TypeConge.CONGE_FORMATION: return 'JUSTIFICATIF_FAMILLE';
      default: return 'JUSTIFICATIF_FAMILLE';
    }
  }

  private preValidateForm(): boolean {
    if (this.demandeForm.invalid) {
      this.marquerChampsCommeTouches();
      this.toastrService.error('Veuillez remplir correctement tous les champs obligatoires.', 'Erreur');
      return false;
    }
    if (!this.employeId) {
      this.toastrService.error('Impossible d\'identifier votre profil.', 'Erreur');
      return false;
    }
    const typeConge = this.demandeForm.get('typeConge')?.value;
    if (this.isDocumentRequired(typeConge) && this.selectedFiles.length === 0) {
      this.toastrService.error('Les documents justificatifs sont obligatoires pour ce type de congé.', 'Documents manquants');
      return false;
    }
    const validationSolde = this.validerSolde();
    if (!validationSolde.valide) {
      this.toastrService.error(validationSolde.message!, 'Solde insuffisant');
      return false;
    }
    const dateDebut = this.demandeForm.get('dateDebut')?.value;
    const dateFin = this.demandeForm.get('dateFin')?.value;
    const validationDates = this.congeService.verifierValiditeDates(dateDebut, dateFin);
    if (!validationDates.valide) {
      this.toastrService.error(validationDates.message!, 'Dates invalides');
      return false;
    }
    return true;
  }

  private prepareDemandeDto(): DemandeCongeCreateDto {
  const formValue = this.demandeForm.value;
  const typeConge = formValue.typeConge;
  const docsRequired = this.isDocumentRequired(typeConge);
  return {
    employeId: this.employeId!,
    typeConge: typeConge,
    dateDebut: formValue.dateDebut,
    dateFin: formValue.dateFin,
    raison: formValue.raison || undefined,
    documentsJustificatifs: docsRequired && this.selectedFiles.length > 0
      ? this.selectedFiles.map(f => f.name)
      : undefined
  };
}



 private handleSubmitError(error: any): void {
  console.log('Erreur complète:', error); // Pour débugger

  let messageErreur = 'Une erreur est survenue lors de la création de la demande.';
  if (this.isSuccessResponse(error)) {
    this.handleSubmitSuccess();
    return;
  }
  // Sinon traiter comme une vraie erreur
  if (error.status === 400 && error.error?.message) {
    messageErreur = error.error.message;
  } else if (error.error?.message) {
    messageErreur = error.error.message;
  } else if (error.message) {
    messageErreur = error.message;
  }

  this.toastService.error(messageErreur);
}
  private marquerChampsCommeTouches(): void {
    Object.keys(this.demandeForm.controls).forEach(key => {
      const control = this.demandeForm.get(key);
      control?.markAsTouched();
    });
  }

  annuler(): void {
    if (this.demandeForm.dirty || this.selectedFiles.length > 0) {
      const confirmation = confirm('Êtes-vous sûr de vouloir annuler ? Les modifications non sauvegardées seront perdues.');
      if (!confirmation) return;
    }
    this.router.navigate(['dashboard/conges/mes-demandes']);
  }

  resetForm(): void {
  if (this.demandeForm.dirty || this.selectedFiles.length > 0) {
    const confirmation = confirm('Êtes-vous sûr de vouloir réinitialiser le formulaire ?');
    if (!confirmation) return;
  }
  this.resetFormCompletely();
}

  // ========== UTILITAIRES ==========

  getTypeCongeLabel(type: TypeConge): string {
    return this.congeService.getTypeCongeLabel(type);
  }

  getTypesCongeOptions() {
    return this.congeService.getTypesCongeOptions();
  }
  isFieldRequired(fieldName: string): boolean {
    const control = this.demandeForm.get(fieldName);
    if (control?.hasValidator(Validators.required)) return true;
    if (fieldName === 'documentsJustificatifs') {
      const typeConge = this.demandeForm.get('typeConge')?.value;
      return this.isDocumentRequired(typeConge);
    }
    return false;
  }
  isFieldInvalid(fieldName: string): boolean {
    const control = this.demandeForm.get(fieldName);
    if (fieldName === 'documentsJustificatifs') {
      const typeConge = this.demandeForm.get('typeConge')?.value;
      if (this.isDocumentRequired(typeConge)) {
        return this.selectedFiles.length === 0;
      }
      return false;
    }
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
  getFieldError(fieldName: string): string {
    const control = this.demandeForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) return `Ce champ est obligatoire`;
      if (control.errors['datePassee']) return 'La date ne peut pas être dans le passé';
      if (control.errors['preavisInsuffisant']) return 'Un préavis de 30 jours minimum est requis';
      if (control.errors['dateFinInvalide']) return 'La date de fin doit être après la date de début';
    }
    return '';
  }
  getSoldeInfo(): string {
    if (!this.solde) return 'Solde non disponible';
    return `${this.solde.soldeDisponible} / ${this.solde.soldeAcquisTotal} jours disponibles`;
  }
  getSoldeCouleur(): string {
    if (!this.solde) return 'text-secondary';
    return this.congeService.getCouleurBadgeSolde(this.solde.soldeDisponible, this.solde.soldeAcquisTotal);
  }
  formatDate(dateStr: string): string {
    return this.congeService.formatDate(dateStr);
  }
  getDureeLabel(): string {
    return this.congeService.getDureeLabel(this.joursOuvrablesSelectionnes);
  }
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'bi-filetype-pdf';
      case 'jpg':
      case 'jpeg': return 'bi-filetype-jpg';
      case 'png': return 'bi-filetype-png';
      default: return 'bi-file-earmark';
    }
  }
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  private handleError(message: string): void {
    this.toastrService.error(message, 'Erreur');
  }


  resetFormCompletely(): void {
  this.demandeForm.reset({
    typeConge: TypeConge.CONGE_PAYE,
    dateDebut: '',
    dateFin: '',
    raison: '',
    documentsJustificatifs: []
  });

  this.selectedFiles = [];
  this.joursOuvrablesSelectionnes = 0;

  Object.keys(this.demandeForm.controls).forEach(key => {
    const control = this.demandeForm.get(key);
    control?.markAsUntouched();
    control?.markAsPristine();
  });

  const fileInput = document.getElementById('documentsJustificatifs') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}
}
