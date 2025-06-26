import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  returnUrl: string | null = null;



  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject (Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
      this.loginForm = this.fb.group ({
        username: ['',Validators.required],
        password: ['',Validators.required]
      });
      this.activatedRoute.queryParams.subscribe(params => {
        this.returnUrl = params['returnUrl'] || null;
        console.log('LoginComponent - returnUrl recupere: ', this.returnUrl);
      });
  }

  onSubmit(): void {
    this.errorMessage = null;
    if(this.loginForm.valid) {
      this.isLoading = true;
      const {username, password} = this.loginForm.value;

      this.authService.login ({username, password}).subscribe({
        next: (response) => {
          console.log('Connexion reussie: ', response);
          this.isLoading = false;
          if(this.returnUrl){
            this.router.navigateByUrl(this.returnUrl);
          }else {
            this.router.navigate(['/dashboard']);
          }


        },
        error:(err) => {
          console.error('Erreur de connexion: ', err);
          this.errorMessage = err.message || 'Echec de la connexion. Veuillez reessayer';
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'Veuillez entrer votre nom d\'utilisateur et votre mot de passe.';
      this.markAllAsTouched(this.loginForm);
    }
  }

  isFieldInvalid (field: string): boolean {
    const control = this.loginForm.get(field);
    return !! (control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if(!control || !control.errors) {
      return '';
    }
    if (control.hasError('required')){
      return 'Ce champs est requis'
    }
    return '';
  }

  private markAllAsTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAllAsTouched();
      if(control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }


}
