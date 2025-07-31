import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {

  changePasswordForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;


   showCurrentPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;


  private readonly fb =inject(FormBuilder);
  private readonly authService = inject (AuthService);
  private readonly router = inject (Router);


  ngOnInit(): void {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['',Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword:['',Validators.required]
    }, {validators:this.passwordMatchValidator});
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl) : {[key: string]: any }| null =>{
    const newPassword = control.get('newPassword');
    const confirmNewPassword = control.get('confirmNewPassword');

    if (newPassword && confirmNewPassword && newPassword.value !== confirmNewPassword.value){
      return {'mismatch': true};
    }
    return null;
  }

  onSubmit():void {
    this.errorMessage = null;
    this.successMessage = null;

    if(this.changePasswordForm.valid){
      this.isLoading = true;
      const{currentPassword, newPassword, confirmNewPassword} = this.changePasswordForm.value;

      this.authService.changePassword({currentPassword, newPassword, confirmNewPassword}).subscribe({
        next: (response) =>{
          console.log('Changement de mot de passe réussi:', response);
          this.successMessage = response.message || 'Votre mot de passe a été change avec succés';
          this.changePasswordForm.reset();
          this.isLoading = false;

          this.showCurrentPassword = false;
          this.showNewPassword = false;
          this.showConfirmNewPassword = false;
        },
        error:(err) =>{
          console.error('Erreur de chamgement de mot de passe:', err);
          if (err.error && err.error.message){
            this.errorMessage= err.error.message;
          } else {
            this.errorMessage = 'Une erreur est survenue lors du changement de mot de passe. Veuillez réessayer.';
          }
          this.isLoading = false;
        }
      });
    }else {
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
      this.markAllAsTouched(this.changePasswordForm);

    }
  }


  isFieldInvalid(field: string): boolean {

    const control = this.changePasswordForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(field: string): string {
    const control = this.changePasswordForm.get(field);
    if(!control || !control.errors){
      return '';
    }
    if(control.hasError('required')){
      return 'Ce champ est requis.'
    }
      if (control.hasError('minlength')) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return `Minimum ${requiredLength} caractères requis.`;
    }
    if (field === 'confirmNewPassword' && this.changePasswordForm.hasError('mismatch')) {
      return 'Les nouveaux mots de passe ne correspondent pas.';
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



   toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmNewPasswordVisibility(): void {
    this.showConfirmNewPassword = !this.showConfirmNewPassword;
  }

}


