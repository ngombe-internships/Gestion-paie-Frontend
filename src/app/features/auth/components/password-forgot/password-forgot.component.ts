import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-password-forgot',
  imports: [ReactiveFormsModule,CommonModule,RouterLink],
  templateUrl: './password-forgot.component.html',
  styleUrl: './password-forgot.component.css'
})
export class PasswordForgotComponent implements OnInit {

  forgotPasswordForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);



  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      emailOrUsername:['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if(this.forgotPasswordForm.valid){
      this.isLoading = true;
      const{emailOrUsername} = this.forgotPasswordForm.value

      this.authService.passwordResetRequest(emailOrUsername).subscribe({
        next:(response) =>{
          this.successMessage = response.message || 'Si votre compte existe, un lien de réiitialisation a éte envoye a votre adress e-mail.'
        this.isLoading = false;
        this.forgotPasswordForm.reset();
        },
        error: (err) =>{
          this.successMessage ='Si votre compte existe, un lien de réinitialisation a été envoye a votre adresse e-mail.';
          this.errorMessage = null;
          this.isLoading = false;
          console.error('Erreur lors de la demande de réinitilisation:', err);
        }
      });
    } else {
      this.errorMessage = 'Veuillez entrer une adresse e-mail ou un nom d\'utilisateur valide.';
      this.markAllAsTouched(this.forgotPasswordForm);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.forgotPasswordForm.get(field);
   return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(field: string): string {
    const control = this.forgotPasswordForm.get(field);
     if(!control || !control.errors){
      return '';
    }
    if (control.hasError('required')){
      return 'Ce champ est requis.'
    }
    if (control.hasError('email')){
      return 'Veillez entrez une adresse e-mail valide';
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

}
