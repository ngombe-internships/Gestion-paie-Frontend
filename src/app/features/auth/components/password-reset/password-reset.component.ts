import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-password-reset',
  imports: [ReactiveFormsModule,RouterLink,CommonModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})



export class PasswordResetComponent implements OnInit {

  passwordResetForm!: FormGroup;
  token: string | null = null;
  errorMessage: string | null = null;
  sucessMessage: string | null = null;
  isLoading: boolean = false;

  showNewPassword = false;
  showConfirmNewPassword = false;


  private readonly fb = inject(FormBuilder);
  private readonly route = inject (ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);


  ngOnInit(): void {

    this.route.paramMap.subscribe(params =>{
      this.token = params.get('token');
      if(!this.token){
        this.errorMessage = 'Jeton de réinitialisation de mot de pass introuvable.';
      }
    });

    this.passwordResetForm = this.fb.group({
      newPassword:['',[
        Validators.required,
        Validators.minLength(6),
      ]],
      confirmPassword:['', Validators.required]
    },{validators: this.passwordMatchValidator});
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if(newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return{passwordMismatch: true};
    }
    return null;
  }

  onSubmit(): void {
    this.errorMessage = null ;
    this.sucessMessage = null;

    if(!this.token){
      this.errorMessage = 'Jeton de réinitialisation de mot de passe manquant. Veuillez utiliser le lien complet fourni dans l\'e-mail.';
      return;
    }
    if(this.passwordResetForm.valid){
      this.isLoading = true;
     const {newPassword, confirmPassword} = this.passwordResetForm.value;

     const resetDto: PasswordResetDto = {
      token: this.token,
      newPassword: newPassword,
      confirmPassword: confirmPassword
      };
      this.authService.resetPassword(resetDto).subscribe({
        next:(response) =>{
          this.sucessMessage = response.message || 'Votre mot de passe a été réinitialisé avec succés ! Vous pouvez maintenant vous connecter.';
          this.isLoading = false;
          this.passwordResetForm.reset();
          setTimeout(()=>{
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (err) =>{
          this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe. Veuillez réessayer ou demander un nouveau lien. ';
          this.isLoading = false;
          console.error('Password reset error:', err);
        }
      });
    } else {
      this.errorMessage = 'Veuillez corriger les erreur dans le formulaire.';
      this.markAllAsTouched(this.passwordResetForm);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.passwordResetForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(field: string): string {
    const control = this.passwordResetForm.get(field);
    if(!control || !control.errors){
      return'';
    }
    if(control.hasError('required')){
      return 'Ce champ est requis.';
    }
    if(control.hasError('minlength')){
      return `Le mot de passe doit contenir au moins ${control.errors['minlength'].requiredLength} cractéres.`
    }
    if(field == 'confirmPassword' && this.passwordResetForm.hasError('passwordMismatch')){
      return 'Les mots de passe ne correspondent pas.'
    }
    return'';
  }

  private markAllAsTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control =>{
      control.markAsTouched();
      if(control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    })
  }


  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmNewPasswordVisibility(): void {
    this.showConfirmNewPassword = !this.showConfirmNewPassword;
  }

   passwordsMatch(): boolean {

    const newPassword= this.passwordResetForm.get('newPassword')?.value;
    const confirmPassword = this.passwordResetForm.get('confirmPassword')?.value;

    // Retourne true si les deux champs sont vides OU s'ils correspondent
    return (!newPassword && !confirmPassword) || (newPassword === confirmPassword);
  }

}

interface PasswordResetDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}


