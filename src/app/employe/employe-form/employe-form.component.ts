import { routes } from './../../app.routes';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { EmployeCreate } from '../../model/employeCreate';
import { EmployeService } from '../../services/employe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Employe } from '../../model/employe';

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


  //Enums pour les listes deroulantes
  statutEmployeEnum: string[] =['EMPLOYE', 'CADRE', 'OUVRIER', 'STAGIAIRE'];
  categorieEnum: string [] = ['I','II','III','IV','V'];
  echelonEnum : string [] = ['A','B','C','D'];
  typeContratEnum : string [] = ['CDD', 'CDI','STAGE'];
  civiliteEnum  : string [] = ['M', 'F'];

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

  private initForm(): void {
    this.employeForm = this.fb.group({


      matricule : ['', [Validators.required]],
      nom :['', [Validators.required]],
      prenom :['', [Validators.required]],
      numeroCnps:['', [Validators.required]],
      niu :['', [Validators.required]],
      email :['', [Validators.email]],
      adresse :['', [Validators.required]],
      telephone :['', [Validators.required]],
      dateEmbauche :['', [Validators.required]],
      poste :['', [Validators.required]],
      service :['', [Validators.required]],
      classificationProfessionnelle :['', [Validators.required]],
      categorie :['', [Validators.required]],
      echelon :['', [Validators.required]],
      typeContratEnum :['', [Validators.required]],
      dateNaissance :['', [Validators.required]],
      // civilite :['', [Validators.required]]
    })
  }

  private loadEmployeData(id: number): void {
    this.employeService.getEmployeById(id).subscribe({
      next: (employe: Employe) => {

        const formattedDateEmbauche = employe.dateEmbauche ? new Date (employe.dateEmbauche).toISOString().split('T')[0] : '';
        const formatteDateNaissance = employe.dateNaissance ? new Date (employe.dateNaissance).toISOString().split('T')[0] : '';

        this.employeForm.patchValue({
          matricule: employe.matricule,
          nom: employe.nom,
          prenom: employe.prenom,
          numeroCnps: employe.numeroCnps,
          niu: employe.niu,
          telephone: employe.telephone,
          email: employe.email,
          adresse: employe.adresse,
          dateEmbauche: formattedDateEmbauche,
          poste: employe.poste,
          service: employe.service,
          classificationProfessionnelle: employe.classificationProfessionnelle,
          categorie: employe.categorie,
          echelon: employe.echelon,
          typeContratEnum: employe.typeContratEnum,
          dateNaissance : employe.dateNaissance
      });
    },
    error: (err) => {
      this.errorMessage = 'Erreur lors du charement des donnes de l\'employe';
      console.error('Eroor Loading employe:', err);
    }
  });
 }


  onSubmit(): void {
    this.errorMessage = null;
    this.sucessMessage = null;

    if (this.employeForm.valid) {
      const employeData: EmployeCreate = this.employeForm.value;

      if(this.isEditMode && this.employeId) {
        this.employeService.uptadeEmploye(this.employeId, employeData).subscribe ({
          next: () => {
            this.sucessMessage = 'Employe mis a jour avec succes!';
            this.router.navigate([`/dashboard/employes`]);
          },
          error: (err) => {
            this.errorMessage = 'Erreur lors de la mise a jour de l\'employe.';
            console.error('Update error:', err);
          }
        });
      } else {
        this.employeService.createEmploye(employeData).subscribe({
          next: () => {
            this.sucessMessage = 'Employé créé avec succès!';
            this.employeForm.reset();
            this.router.navigate(['/dashboard/employes']);
          },
          error: (err) => {
            this.errorMessage = 'Erreur lors de la création de l\'employé.';
            console.error('Create error:', err);
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

  isFieldInvalid (field: string): boolean {
    const control = this.employeForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(field: string): string {
    const control = this.employeForm.get(field);
    if(!control || !control.errors) {
      return '';
    }
    if (control.hasError ('required')) {
      return 'Ce champs est oblogatoire.';
    }
    if (control.hasError('email')) {
      return 'Format d\'email invalid';
    }
    return 'Champ invalide';
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/employes']);
  }

}
