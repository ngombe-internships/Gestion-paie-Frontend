import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EntrepriseService } from '../services/entreprise.service';
import { EntrepriseDto } from '../model/entrepriseDto';
import { EntrepriseUpdateDto } from '../model/entrepriseUpdateDto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entreprise-form',
  imports:[ReactiveFormsModule,CommonModule],
  templateUrl: './entreprise-form.component.html',
  styleUrls: ['./entreprise-form.component.css']
})
export class EntrepriseFormComponent implements OnInit {
  entrepriseForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedLogoFile: File | null = null;
  currentLogoUrl: string | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly entrepriseService = inject(EntrepriseService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.entrepriseForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      adresseEntreprise: ['', [Validators.required]],
      emailEntreprise: ['', [Validators.required, Validators.email]],
      telephoneEntreprise: ['', [Validators.required]],
      logoUrl: [null]
    });
    this.loadEntrepriseForEmployeur();
  }

  loadEntrepriseForEmployeur(): void {
    this.isLoading = true;
    this.entrepriseService.getEntrepriseForEmployeur().subscribe({
      next: (entreprise: EntrepriseDto) => {
        this.currentLogoUrl = entreprise.logoUrl || null;
        this.entrepriseForm.patchValue({
          nom: entreprise.nom,
          adresseEntreprise: entreprise.adresseEntreprise,
          emailEntreprise: entreprise.emailEntreprise,
          telephoneEntreprise: entreprise.telephoneEntreprise
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Impossible de charger les informations de l\'entreprise.';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Seuls les fichiers JPEG, PNG et GIF sont autorisés.';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La taille du fichier ne doit pas dépasser 5MB.';
        return;
      }
      this.selectedLogoFile = file;
      this.errorMessage = null;
    }
  }

  onSubmit(): void {
    if (this.entrepriseForm.invalid) {
      this.markFormGroupTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
    const formValue = this.entrepriseForm.value;

    const updateDto: EntrepriseUpdateDto = {
      nom: formValue.nom,
      adresseEntreprise: formValue.adresseEntreprise,
      emailEntreprise: formValue.emailEntreprise,
      telephoneEntreprise: formValue.telephoneEntreprise,
      logoUrl: this.currentLogoUrl
    };

    this.entrepriseService.updateEntrepriseByEmployer(updateDto, this.selectedLogoFile || undefined).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        this.isLoading = false;
        setTimeout(() => {
           this.router.navigate(['/dashboard/employes']);
        }, 1500);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour de l\'entreprise.';
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.entrepriseForm.controls).forEach(key => {
      this.entrepriseForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.entrepriseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.entrepriseForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} est requis.`;
      if (field.errors['email']) return 'Email invalide.';
      if (field.errors['minlength']) return `${fieldName} trop court.`;
      if (field.errors['min']) return `Valeur trop petite.`;
      if (field.errors['max']) return `Valeur trop grande.`;
    }
    return '';
  }

  goBack(): void {
    this.router.navigate(['/dashboard/employes']);
  }
}
