import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterDto } from '../../model/registerDto';
import { CreateEmployerAndCompanyDto } from '../../model/CreateEmployerAndCompanyDto';

@Component({
  selector: 'app-register-employer',
  imports: [ReactiveFormsModule,CommonModule, RouterModule],
  templateUrl: './register-employer.component.html',
  styleUrl: './register-employer.component.css'
})
export class RegisterEmployerComponent implements OnInit {

  registerEmployerForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;
  selectedFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;
   @ViewChild('topElement') topElement!: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject (Router);

  ngOnInit(): void {
    this.initializeForm();
  }

  // Méthode pour initialiser le formulaire
  private initializeForm(): void {
    this.registerEmployerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      nomEntreprise: ['', Validators.required],
      adresseEntreprise: ['', Validators.required],
      emailEntreprise: ['', [Validators.required, Validators.email]],
      telephoneEntreprise: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      numeroSiret: ['', [Validators.required]],
      dateCreation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

   private resetForm(): void {
    this.registerEmployerForm.reset();
    this.selectedFile = null;


    // Réinitialiser l'input file
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }

    // Marquer tous les champs comme non touchés
    this.registerEmployerForm.markAsUntouched();
    Object.keys(this.registerEmployerForm.controls).forEach(key => {
      this.registerEmployerForm.get(key)?.markAsUntouched();
      this.registerEmployerForm.get(key)?.markAsPristine();
    });
  }

  // Méthode pour scroller vers le haut
  private scrollToTop(): void {
    if (this.topElement?.nativeElement) {
      this.topElement.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback si l'élément n'existe pas
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }


  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement; // Caster l'élément cible en HTMLInputElement
    if (input.files && input.files.length > 0) { // Vérifier si 'files' existe et contient des éléments
      const file = input.files[0];
      this.selectedFile = file;
      if (!this.isValidImage(file)) {
        this.errorMessage = 'Veuillez sélectionner un fichier image valide (JPEG, PNG, GIF).';
        this.selectedFile = null; // Réinitialiser pour éviter d'envoyer un fichier invalide
        this.scrollToTop();
        this.clearMessagesAfterDelay();
      } else {
        this.errorMessage = null; // Effacer le message d'erreur si le fichier est valide
      }
    } else {
      this.selectedFile = null; // Réinitialiser si aucun fichier n'est sélectionné ou si la sélection est annulée
      this.errorMessage = null; // Effacer tout message d'erreur précédent lié à la sélection de fichier
    }
  }

  //decleche lor du clique
  triggerFileInputClick(): void {
    this.fileInput.nativeElement.click();
  }

  // Validation du type de fichier image
  isValidImage(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return allowedTypes.includes(file.type);
  }


  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : {mismatch: true};
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

     if (this.registerEmployerForm.valid) {
      const formValue = this.registerEmployerForm.value;

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


     // Crée un objet FormData pour envoyer le JSON et le fichier
      const formData = new FormData();
      // Ajoute le DTO en tant que Blob JSON
      formData.append('createDto', new Blob([JSON.stringify(createDto)], { type: 'application/json' }));

      // Ajoute le fichier si sélectionné
      if (this.selectedFile) {
        formData.append('logo', this.selectedFile, this.selectedFile.name);
      }

      this.authService.registerEmployerCompany(formData).subscribe({ // La méthode du service doit accepter FormData
        next: (response) => {
          this.isLoading = false;
          if (response.data) {
            this.successMessage = response.message;
            this.scrollToTop();
            this.clearMessagesAfterDelay();

            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.errorMessage = response.message || 'Échec de l\'enregistrement de l\'employeur.';
            this.scrollToTop();
            this.clearMessagesAfterDelay();
            this.resetForm();
            this.isLoading = false;
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur d\'enregistrement employeur:', err);
          this.errorMessage = err.error?.message || err.message || 'Échec de l\'enregistrement de l\'employeur. Veuillez réessayer.';

          this.scrollToTop();
          this.clearMessagesAfterDelay();
         // this.resetForm();
        }
      });
    } else {
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
      this.markAllAsTouched(this.registerEmployerForm);
      this.isLoading = false;
      this.scrollToTop();
    }
  }


 isFieldInvalid(field: string): boolean {
   const control = this.registerEmployerForm.get(field);
   return !!(control && control.invalid && (control.touched || control.dirty))
 }

 getErrorMessage(field: string): string {
    const control = this.registerEmployerForm.get(field);
    if (!control || !control.errors) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Ce champ est requis.';
    }
    if (control.hasError('minlength')) {
      return `Minimum ${control.errors['minlength'].requiredLength} caractères requis.`;
    }
    if (field === 'confirmPassword' && this.registerEmployerForm.hasError('mismatch')) {
      return 'Les mots de passe ne correspondent pas.';
    }
     if (control?.hasError('pattern')) {
    return 'Format invalide.';
    }
    return '';
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
      this.successMessage= null;
      this.errorMessage = null;
    }, 4000);
  }


}
