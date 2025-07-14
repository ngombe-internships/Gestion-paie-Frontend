import { routes } from './../../app.routes';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { EmployeCreate } from '../../model/employeCreate';
import { EmployeService } from '../../services/employe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Employe } from '../../model/employe';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-employe-form',
  imports: [ReactiveFormsModule],
  templateUrl: './employe-form.component.html',
  styleUrl: './employe-form.component.css'
})
export class EmployeFormComponent implements OnInit {
  employeForm!: FormGroup;
  isEditMode : boolean = false;
  employeId : number | null = null
  errorMessage: string | null = null;
  sucessMessage: string | null = null;
  currentStep: number = 1;
  totalSteps: number = 3;


  //Enums pour les listes deroulantes
  statutEmployeEnum: string[] =['EMPLOYE', 'CADRE', 'OUVRIER', 'STAGIAIRE'];
  categorieEnum: string [] = ['I','II','III','IV','V'];
  echelonEnum : string [] = ['A','B','C','D'];
  typeContratEnum : string [] = ['CDD', 'CDI','STAGE'];
  SexeEnum  : string [] = ['M', 'F'];

  private readonly fb = inject (FormBuilder) ;
  private readonly employeService = inject(EmployeService);
  private readonly router = inject (Router);
  private readonly route = inject (ActivatedRoute);



  ngOnInit(): void {
      this.initForm();
      this.route.params.subscribe(params => {
        if(params['id']) {
          this.isEditMode = true;
          this.employeId = +params ['id'];
          this.loadEmployeData(this.employeId);
        }
      })
  }

  private initForm(employe?: Employe): void {
    this.employeForm = this.fb.group({

    informationsPersonnelles: this.fb.group({
        matricule: [employe?.matricule || '', [Validators.required]],
        nom: [employe?.nom || '', [Validators.required]],
        prenom: [employe?.prenom || '', [Validators.required]],
        numeroCnps: [employe?.numeroCnps || '', [Validators.required]],
        niu: [employe?.niu || '', [Validators.required]],
        email: [employe?.email || '', [Validators.email, Validators.required]],
        adresse: [employe?.adresse || '', [Validators.required]],
        telephone: [employe?.telephone || ''],
        dateNaissance: [employe?.dateNaissance || '', [Validators.required]],
        sexe: [employe?.sexe || '', [Validators.required]]
      }),
      informationsProfessionnelles: this.fb.group({
        dateEmbauche: [employe?.dateEmbauche || '', [Validators.required]],
        poste: [employe?.poste || '', [Validators.required]],
        service: [employe?.service || '', [Validators.required]],
        classificationProfessionnelle: [employe?.classificationProfessionnelle || '', [Validators.required]],
        categorie: [employe?.categorie || '', [Validators.required]],
        echelon: [employe?.echelon || '', [Validators.required]],
        typeContratEnum: [employe?.typeContratEnum || '', [Validators.required]]
      }),
     detailsContractuels: this.fb.group({

      heuresContractuellesHebdomadaires: [employe?.heuresContractuellesHebdomadaires ?? null, [Validators.required, Validators.min(1)]],
        joursOuvrablesContractuelsHebdomadaires: [employe?.joursOuvrablesContractuelsHebdomadaires ?? null, [Validators.required, Validators.min(1),Validators.max(7)]],
        salaireBase: [employe?.salaireBase ?? null, [Validators.required, Validators.min(0)]]
     })


    })
  }

  //currentstep =  etape actuel
  getCurrentStepFormGroup(): FormGroup | null {
  switch (this.currentStep){
    case 1 :return this.employeForm.get('informationsPersonnelles') as FormGroup;
    case 2 : return this.employeForm.get('informationsProfessionnelles') as FormGroup;
    case 3 : return this.employeForm.get('detailsContractuels') as FormGroup;
    default: return null;
  }
 }

 validateCurrentStep() : boolean {
  const currentFormGroup = this.getCurrentStepFormGroup();
  if(currentFormGroup) {
    this.markAllAsTouched(currentFormGroup);
    return currentFormGroup.valid;
  }
  return false;
 }

 nextStep():void {
  if(this.currentStep < this.totalSteps){
    if(this.validateCurrentStep()){
     this.currentStep++;
     this.errorMessage = null;
     this.sucessMessage = null;
    } else {
     this.errorMessage = 'Veuillez corriger les erreur avant de passer á l\'etape suivante.';
   }
  } else {
    this.onSubmit();
  }

 }

 previousStep(): void {
  if(this.currentStep >1){
    this.currentStep--;
    this.errorMessage = null;
    this.sucessMessage = null;
  }
 }



  private loadEmployeData(id: number): void {
    this.employeService.getEmployeById(id).subscribe({
      next: (employe: Employe) => {

        const formattedDateEmbauche = employe.dateEmbauche ? new Date (employe.dateEmbauche).toISOString().split('T')[0] : '';
        const formatteDateNaissance = employe.dateNaissance ? new Date (employe.dateNaissance).toISOString().split('T')[0] : '';

        this.employeForm.get('informationsPersonnelles')?.patchValue({
          matricule: employe.matricule,
          nom: employe.nom,
          prenom: employe.prenom,
          numeroCnps: employe.numeroCnps,
          niu: employe.niu,
          telephone: employe.telephone,
          email: employe.email,
          adresse: employe.adresse,
          dateNaissance : formatteDateNaissance,
          sexe: employe.sexe,
        });
        this.employeForm.get('informationsProfessionnelles')?.patchValue({
          dateEmbauche: formattedDateEmbauche,
          poste: employe.poste,
          service: employe.service,
          classificationProfessionnelle: employe.classificationProfessionnelle,
          categorie: employe.categorie,
          echelon: employe.echelon,
          typeContratEnum: employe.typeContratEnum,

        });
        this.employeForm.get('detailsContractuels')?.patchValue({
          heuresContractuellesHebdomadaires:employe.heuresContractuellesHebdomadaires,
          joursOuvrablesContractuelsHebdomadaires: employe.joursOuvrablesContractuelsHebdomadaires,
          salaireBase: employe.salaireBase
        })
    },
    error: (err) => {
      this.errorMessage = 'Erreur lors du charement des donnes de l\'employe';
      console.error('Eroor Loading employe:', err);
    }
  });
 }



  onSubmit(): void {


  if(!this.validateCurrentStep()) {
    this.errorMessage = 'Veuillez corriger les erreurs avant de soummetre le formulaire.'
    return;
  }

    if (this.employeForm.valid) {
      const formValue = this.employeForm.value;
      const employeData: EmployeCreate = {
        ...formValue.informationsPersonnelles,
        ...formValue.informationsProfessionnelles,
        ...formValue.detailsContractuels,
      }

      if(new Date(employeData.dateEmbauche) > new Date()){
        this.errorMessage = 'La date d\'embauche ne peut pas etre dans le futur. '
        return;
      }
       if(new Date(employeData.dateNaissance) > new Date()){
        this.errorMessage = 'La date de naissance ne peut pas etre dans le futur. '
        return;
      }



      if(this.isEditMode && this.employeId) {
        this.employeService.uptadeEmploye(this.employeId, employeData).subscribe ({
          next: () => {
            this.sucessMessage = 'Employe mis a jour avec succes!';
            this.errorMessage = null;
            setTimeout(() => {
              this.router.navigate([`/dashboard/employes`]);
            }, 2000)

          },
         error: (err: HttpErrorResponse) => {
          console.error('Create error:', err);
          if(err.error && typeof err.error === 'object' && err.error.message) {

            this.errorMessage = `Erreur lors de la mise a jour de l\'employé: ${err.error.message}`;
            } else if (err.status === 409){

              this.errorMessage = 'Erreur: Un employe avec ce matricule ou NIU existe deja.';
           } else if (err.status === 400 && err.error && typeof err.error === 'object'){
            let detaileError = 'Erreur de validation : ';
            for (const key in err.error) {
             if (err.error.hasOwnProperty(key)) {
                detaileError += `${key}: ${err.error[key]};`;
             }
           }
            this.errorMessage = detaileError.trim(); // Supprime les espaces inutiles en fin de chaîne
        } else {
        // Condition par défaut: Pour toutes les autres erreurs non gérées spécifiquement
        this.errorMessage = 'Erreur lors de la création de l\'employé. Veuillez réessayer.';
      }
}
        });
      } else {
        this.employeService.createEmploye(employeData).subscribe({
          next: () => {
            this.sucessMessage = 'Employé créé avec succès!';
            this.errorMessage = null;
            this.employeForm.reset();
            this.currentStep =1 ;
            setTimeout(() => {
            this.router.navigate(['/dashboard/employes']);
            }, 2000);
          },
       error: (err: HttpErrorResponse) => {
    console.error('Create error:', err);
    if(err.error && typeof err.error === 'object' && err.error.message) {
        this.errorMessage = `Erreur lors de la création de l\'employé: ${err.error.message}`;
    } else if (err.status === 409){

      this.errorMessage = 'Erreur: Un employe avec ce matricule ou NIU existe deja.';
    } else if (err.status === 400 && err.error && typeof err.error === 'object'){

      let detaileError = 'Erreur de validation : ';
        for (const key in err.error) {
            if (err.error.hasOwnProperty(key)) {
                detaileError += `${key}: ${err.error[key]};`;
            }
        }
        this.errorMessage = detaileError.trim(); // Supprime les espaces inutiles en fin de chaîne
    } else {
        this.errorMessage = 'Erreur lors de la création de l\'employé. Veuillez réessayer.';
    }
  }

        });
      }
    } else {
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
      this.markAllAsTouched(this.employeForm);
    }
  }

  private markAllAsTouched (formGroup : FormGroup) {
   Object.values (formGroup.controls).forEach(control => {
    control.markAsTouched();
    if (control instanceof FormGroup) {
      this.markAllAsTouched(control);
    }
   });
  }

  isFieldInvalid (controlName: string): boolean {
    const currentFormGroup = this.getCurrentStepFormGroup();
    if (currentFormGroup){
      const control = currentFormGroup.get(controlName);
      return !!(control && control.invalid && (control.touched || control.dirty ));
    }
    return false;
  }

  getErrorMessage(controlName: string): string {
    const currentFormGroup = this.getCurrentStepFormGroup();
    if(currentFormGroup){
    const control = currentFormGroup.get(controlName);
    if(!control || !control.errors) {
      return '';
    }
      if (control.hasError('required')) {
        return 'Ce champ est obligatoire.';
      }
      if (control.hasError('email')) {
        return 'Format d\'email invalide.';
      }
      if (control.hasError('min')) {
        return `La valeur minimale est ${control.errors['min'].min}.`;
      }
      if (control.hasError('max')) {
        return `La valeur maximale est ${control.errors['max'].max}.`;
      }
      if (control.hasError('minlength')) {
        return `Minimum ${control.errors['minlength'].requiredLength} caractères.`;
      }
      if (control.hasError('maxlength')) {
        return `Maximum ${control.errors['maxlength'].requiredLength} caractères.`;
      }
    }
  return'';
}
  onCancel(): void {
    this.router.navigate(['/dashboard/employes']);
  }

}
