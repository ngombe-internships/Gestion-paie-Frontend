import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employe } from '../../model/employe';
import { AuthService } from '../../services/auth.service';
import { EmployeService } from '../../services/employe.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null ;
  isLoading: boolean = false;
  employes: Employe [] = [];

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly employeService = inject (EmployeService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.registerForm = this.fb.group ({
       username: ['', [Validators.required, Validators.minLength(3)]],
       password: ['',[Validators.required, Validators.minLength(6)]],
       confirmPassword:['',Validators.required],
       employeId: [null, Validators.required]
      }, {validators: this.passwordMatchValidator});
      this.loadEmployes();
  }


  loadEmployes(): void {
    this.employeService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des employes:', err);
        this.errorMessage = 'Impossible de charger la liste des employes.';
      }
    });
  }

  passwordMatchValidator (formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword?null : {mismatch: true};
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;
    if(this.registerForm.valid){
      this.isLoading = true;
      const {username, password, employeId} = this.registerForm.value;


      this.authService.register({ username, password, employeId: Number(employeId)}).subscribe({
        next:(response) => {
          this.successMessage = response.message || 'inscription reussie! Employe peut maintenant ce connecter.';
          this.isLoading = false;
          this.registerForm.reset();


        },
        error: (err) => {
          console.error('Erreur d\'inscription:', err);
          this.errorMessage = err.message || 'Echec de l\'inscription. Veuillez reessaye.';
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage ='Veuillez corriger les erreurs dans le formulaire';
      this.markAllAsTouched(this.registerForm);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty))
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if(!control || !control.errors) {
      return '';
    }
    if(control.hasError('required')) {
      return 'Ce champ est requis.';
    }
    if (control.hasError('minLength')){
      return `Minimun ${control.errors['minlength'].requiredLenght} caracteres requis.`;
    }
    if(field === 'confirmPassword' && this.registerForm.hasError('mismatch')) {
      return 'Les mots de passe ne correspondent pas.';
    }
    return '';
  }

  private markAllAsTouched (formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if(control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }







}
