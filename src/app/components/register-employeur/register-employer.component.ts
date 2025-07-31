import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EntrepriseService } from '../../services/entreprise.service';
import { CreateEmployerAndCompanyDto } from '../../model/CreateEmployerAndCompanyDto';

@Component({
  selector: 'app-register-employer',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register-employer.component.html',
  styleUrl: './register-employer.component.css'
})
export class RegisterEmployerComponent implements OnInit {
  registerEmployerForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;
  selectedFile: File | null = null;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  currentActive: boolean = true;

  entrepriseId: number | null = null;
  isEditMode: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('topElement') topElement!: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly entrepriseService = inject(EntrepriseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.entrepriseId = Number(idParam);
      this.initializeForm();
      this.loadEmployerAndCompany(this.entrepriseId);
    } else {
      this.isEditMode = false;
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    this.registerEmployerForm = this.fb.group({
      username: [{ value: '', disabled: this.isEditMode }, [Validators.required, Validators.minLength(3)]],
      password: [{ value: '', disabled: this.isEditMode }, [Validators.required, Validators.minLength(6)]],
      confirmPassword: [{ value: '', disabled: this.isEditMode }, Validators.required],
      nomEntreprise: ['', Validators.required],
      adresseEntreprise: ['', Validators.required],
      emailEntreprise: ['', [Validators.required, Validators.email]],
      telephoneEntreprise: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      numeroSiret: ['', [Validators.required]],
      dateCreation: ['', [Validators.required]]
    }, { validators: this.isEditMode ? null : this.passwordMatchValidator });
  }

  loadEmployerAndCompany(id: number): void {
    this.isLoading = true;
    this.entrepriseService.getEntrepriseByIdForAdmin(id).subscribe({
      next: (entreprise) => {
        this.registerEmployerForm.patchValue({
          nomEntreprise: entreprise.nom,
          adresseEntreprise: entreprise.adresseEntreprise,
          emailEntreprise: entreprise.emailEntreprise,
          telephoneEntreprise: entreprise.telephoneEntreprise,
          numeroSiret: entreprise.numeroSiret,
          dateCreation: entreprise.dateCreation ? new Date(entreprise.dateCreation).toISOString().split('T')[0] : ''
        });
        this.currentActive = entreprise.active;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Impossible de charger les informations.';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      if (!this.isValidImage(file)) {
        this.errorMessage = 'Veuillez sélectionner un fichier image valide (JPEG, PNG, GIF).';
        this.selectedFile = null;
        this.clearMessagesAfterDelay();
      } else {
        this.errorMessage = null;
      }
    } else {
      this.selectedFile = null;
      this.errorMessage = null;
    }
  }

  triggerFileInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  isValidImage(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return allowedTypes.includes(file.type);
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    if (this.selectedFile && !this.isValidImage(this.selectedFile)) {
      this.errorMessage = 'Le fichier sélectionné n\'est pas une image valide.';
      this.isLoading = false;
      this.scrollToTop();
      this.clearMessagesAfterDelay();
      return;
    }

    if (this.registerEmployerForm.invalid) {
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
      this.markAllAsTouched(this.registerEmployerForm);
      this.isLoading = false;
      this.scrollToTop();
      this.clearMessagesAfterDelay();
      return;
    }

    const formValue = this.registerEmployerForm.getRawValue();

    if (this.isEditMode) {
      // Update (ADMIN)
      const updateDto = {
        nom: formValue.nomEntreprise,
        adresseEntreprise: formValue.adresseEntreprise,
        emailEntreprise: formValue.emailEntreprise,
        telephoneEntreprise: formValue.telephoneEntreprise,
        numeroSiret: formValue.numeroSiret,
        dateCreation: formValue.dateCreation,
        active: this.currentActive ?? true
      };

      this.entrepriseService.updateEntrepriseByAdmin(this.entrepriseId!, updateDto, this.selectedFile || undefined).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message;
          this.scrollToTop();
          setTimeout(() => {
            this.router.navigate(['/dashboard/employeur']);
          }, 1500);
        },
        error: (err) => {
          this.isLoading = false;
          this.handleBackendErrors(err);
        }
      });
    } else {
      // Création (ADMIN)
      const createDto: CreateEmployerAndCompanyDto = {
        username: formValue.username,
        password: formValue.password,
        nomEntreprise: formValue.nomEntreprise,
        adresseEntreprise: formValue.adresseEntreprise,
        emailEntreprise: formValue.emailEntreprise,
        telephoneEntreprise: formValue.telephoneEntreprise,
        numeroSiret: formValue.numeroSiret,
        dateCreation: formValue.dateCreation
      };
      const formData = new FormData();
      formData.append('createDto', new Blob([JSON.stringify(createDto)], { type: 'application/json' }));
      if (this.selectedFile) formData.append('logo', this.selectedFile);

      this.authService.registerEmployerCompany(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message;
          this.scrollToTop();
          setTimeout(() => {
            this.router.navigate(['/dashboard/employeur']);
          }, 1500);
        },
        error: (err) => {
          this.isLoading = false;
          this.handleBackendErrors(err);
        }
      });
    }
  }


  private handleBackendErrors(err: any): void {
    if (err.error) {
      if (err.error.errors && typeof err.error.errors === 'object') {
        const fieldErrors = err.error.errors;
        let errorMessages = [];

        for (const [field, message] of Object.entries(fieldErrors)) {
          const control = this.registerEmployerForm.get(field);
          if (control) {
            control.setErrors({ backendError: message });
            control.markAsTouched();
          }
          errorMessages.push(`${this.getFieldLabel(field)}: ${message}`);
        }

        this.errorMessage = errorMessages.join(', ');
      }
      else if (err.error.message) {
        this.errorMessage = err.error.message;
      }
      else if (typeof err.error === 'string') {
        this.errorMessage = err.error;
      }
      else {
        this.errorMessage = 'Une erreur s\'est produite lors de l\'opération.';
      }
    } else {
      this.errorMessage = 'Erreur de connexion au serveur.';
    }

    this.scrollToTop();
    this.clearMessagesAfterDelay();
  }

  // Méthode pour obtenir le label français d'un champ
  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      'username': 'Nom d\'utilisateur',
      'password': 'Mot de passe',
      'nomEntreprise': 'Nom de l\'entreprise',
      'numeroSiret': 'Numéro SIRET',
      'adresseEntreprise': 'Adresse',
      'emailEntreprise': 'Email',
      'telephoneEntreprise': 'Téléphone',
      'dateCreation': 'Date de création'
    };
    return labels[field] || field;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerEmployerForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(field: string): string {
    const control = this.registerEmployerForm.get(field);
    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('backendError')) {
      return control.errors['backendError'];
    }

    if (control.hasError('required')) {
      return 'Ce champ est requis.';
    }
    if (control.hasError('minlength')) {
      return `Minimum ${control.errors['minlength'].requiredLength} caractères requis.`;
    }
    if (control.hasError('email')) {
      return 'Format d\'email invalide.';
    }
    if (control.hasError('pattern')) {
      if (field === 'telephoneEntreprise') {
        return 'Le téléphone doit contenir entre 8 et 15 chiffres.';
      }
      return 'Format invalide.';
    }

    // Gestion spéciale pour la validation des mots de passe
    if (field === 'confirmPassword' && this.registerEmployerForm.hasError('mismatch')) {
      return 'Les mots de passe ne correspondent pas.';
    }

    return '';
  }

  // NOUVELLE MÉTHODE pour vérifier si les mots de passe correspondent
  passwordsMatch(): boolean {
    if (this.isEditMode) return true; // Pas de vérification en mode édition

    const password = this.registerEmployerForm.get('password')?.value;
    const confirmPassword = this.registerEmployerForm.get('confirmPassword')?.value;

    // Retourne true si les deux champs sont vides OU s'ils correspondent
    return (!password && !confirmPassword) || (password === confirmPassword);
  }

  private markAllAsTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
      // Nettoyer aussi les erreurs backend des champs
      Object.keys(this.registerEmployerForm.controls).forEach(key => {
        const control = this.registerEmployerForm.get(key);
        if (control && control.hasError('backendError')) {
          const errors = { ...control.errors };
          delete errors['backendError'];
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
      });
    }, 5000);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Méthode pour scroller vers le haut (utilise topElement)
  private scrollToTop(): void {
    if (this.topElement) {
      this.topElement.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}
