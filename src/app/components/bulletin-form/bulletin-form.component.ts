import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BulletinPaieResponseDto, BulletinService } from '../../services/bulletin.service';
import { BulletinPaie, BulletinPaieCreateDto } from '../../model/bulletin';
import { BulletinPreviewComponent } from '../bulletin-preview/bulletin-preview.component';
import { EmployeService } from '../../services/employe.service';
import { ActivatedRoute } from '@angular/router';
import { Employe } from '../../model/employe';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-bulletin-form',
  standalone: true,
  imports: [ReactiveFormsModule, BulletinPreviewComponent],
  templateUrl: './bulletin-form.component.html',
  styleUrls: ['./bulletin-form.component.css']
})
export class BulletinFormComponent implements OnInit {
  formGroup!: FormGroup;
  bulletinCalcule: BulletinPaieResponseDto | null = null;
  selectedEmploye: Employe | null = null;
  isBulletinCalculated: boolean = false;
  calculatedBulletinData: BulletinPaie | null =null;
  currentEntrepriseId: number | null = null;
   methodePaiementOptions: string[] = [
    'VIREMENT',
    'CHEQUE',
    'ESPECES',
    'OM',
    'MOBILE_MONEY',
    'AUTRE'
  ];

  private readonly fb = inject (FormBuilder) ;
  private readonly bulletinService = inject(BulletinService) ;
  private readonly route = inject(ActivatedRoute);
  private readonly employeService = inject(EmployeService);
  private readonly toastrService = inject(ToastrService);
  private readonly authService = inject(AuthService);
  isCalculating: any;

  constructor() {}

  ngOnInit(): void {
    this.initForm();
    this.route.queryParams.subscribe(params => {
      const employeId = params['employeId'];
      if (employeId) {
        this.employeService.getEmployeById(employeId).subscribe({
          next: (response: Employe) => {
            this.selectedEmploye = response;
            console.log('Employee details loaded:', this.selectedEmploye);

          },
          error: (error) => {
            console.error('Erreur lors du chargement de l\'employe:', error);
            this.toastrService.error('Impossible de charger les donnes de l\'employe')
          }
        });
      }
    });
    this.currentEntrepriseId = this.authService.getEntrepriseId();
    if(!this.currentEntrepriseId) {
      this.toastrService.error('ID d\'entreprise non trouve. Veuillez vous reconnecter.')
    }
  }
  private initForm(): void {
    this.formGroup = this.fb.group({

      heuresSup: [0, [Validators.min(0)]],
      heuresFerie: [0, [Validators.min(0)]],
      heuresNuit: [0, [Validators.min(0)]],

      datePaiement: [null, Validators.required], // Rendre obligatoire la date de paiement
      methodePaiement: [this.methodePaiementOptions[0], Validators.required] // Rendre obligatoire la méthode de paiement

    });
  }

  private loadEmployeDetails(id: number): void {
    this.employeService.getEmployeById(id).subscribe({
      next: (employe: Employe) => {
        this.selectedEmploye = employe;

        console.log('Employee details loaded:', employe);
      },
      error: (error) => {
        console.error('Error loading employee details:', error);
        //alert('Erreur lors du chargement des détails de l\'employé.');
      }
    });
  }


  isFieldValid(fieldName: string): boolean {
    const field = this.formGroup.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  submit(event: Event): void {
    event.preventDefault();

    if (this.formGroup.valid && this.selectedEmploye && this.currentEntrepriseId) {
      this.isCalculating = true;


      const bulletinData: BulletinPaieCreateDto = {
        employeId:  this.selectedEmploye.id! ,
        entrepriseId:this.currentEntrepriseId! ,
        heuresSup: this.formGroup.get('heuresSup')?.value || 0,
        heuresFerie: this.formGroup.get('heuresFerie')?.value || 0,
        heuresNuit: this.formGroup.get('heuresNuit')?.value || 0,
        datePaiement: this.formGroup.get('datePaiement')?.value,
        methodePaiement: this.formGroup.get('methodePaiement')?.value

      };
        

     // Vérifier le payload
     console.log('Payload envoyé au backend:', bulletinData);

      if(!this.isBulletinCalculated){
        console.log('Données envoyées au service pour calcul :', bulletinData);

        //etape 1 calculer le bulletin
         this.bulletinService.calculerBulletin(bulletinData).subscribe({
           next: (response) => {
           this.bulletinCalcule = response.data;
           this.calculatedBulletinData = bulletinData;
           this.isBulletinCalculated = true;
           console.log('Bulletin calculé reçu (sans ID):', this.bulletinCalcule);
           this.toastrService.success('Bulletin de paie calcule. Cliquez dur "Sauvegarder le Bulletin pour  "')
        },
        error: (error) => {
          console.error('Erreur lors du calcul du bulletin:', error);
          this.toastrService.error('Veuillez corriger les erreurs dans le formulaire.');
         },
        });
      } else {
        // etape 2 sauvergarde le bulletin
        if(this.calculatedBulletinData) {
          console.log('Sauvegarde du bulletin calcule:', this.calculatedBulletinData);

           const toSave = { ...this.calculatedBulletinData };
           delete (toSave as any).id;
          this.bulletinService.creerBulletin(this.calculatedBulletinData).subscribe({
            next:(response) => {


              this.bulletinCalcule = response.data; // Le DTO ici AURA l'ID
              this.isBulletinCalculated = false; // Réinitialiser pour un nouveau calcul
              this.calculatedBulletinData = null; // Vider les données intermédiaires
              console.log('Bulletin sauvegardé avec ID:', this.bulletinCalcule.id);
              this.toastrService.success('Bulletin de paie sauvegardé avec succès! Le PDF est maintenant disponible.');
            },
            error: (error) => {
              console.error('Erreur lors de la sauvegarde du bulletin:', error);
              this.toastrService.error('Erreur lors de la sauvegarde. Vérifiez la console pour plus de détails.');
            }
          });
        } else {
          console.error("Aucune donnée de bulletin à sauvegarder.");
          this.toastrService.error("Veuillez d'abord calculer le bulletin.");
        }
      }
    }  else {
      // Message d'erreur plus spécifique
      let errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
      if (!this.currentEntrepriseId) {
        errorMessage = 'L\'ID de l\'entreprise est manquant. Veuillez vérifier votre connexion.';
      } else if (!this.formGroup.valid) {
        errorMessage = 'Certains champs du formulaire sont invalides. Vérifiez les valeurs saisies.';
        // IMPORTANT : Ce log affichera les erreurs spécifiques de chaque champ du formulaire
        console.log('Détails des erreurs du formulaire:', this.formGroup.controls);
      } else if (!this.selectedEmploye) {
        errorMessage = 'Aucun employé sélectionné. Veuillez sélectionner un employé.';
      }
      // IMPORTANT : Ce log affichera un résumé booléen des conditions
      console.log('Formulaire invalide ou données manquantes:', {
          formValid: this.formGroup.valid,
          selectedEmployePresent: !!this.selectedEmploye,
          entrepriseIdPresent: !!this.currentEntrepriseId,
          formErrors: this.formGroup.errors // Ceci sera souvent null si les erreurs sont sur les contrôles individuels
      });
      this.toastrService.error(errorMessage);
    }
  }

  resetForm(): void {
    this.formGroup.reset();
    this.bulletinCalcule = null;
    this.isBulletinCalculated= false;
    this.calculatedBulletinData = null;
    // this.selectedEmploye = null;
    // Réinitialiser avec des valeurs par défaut
    this.formGroup.patchValue({

      heuresSup: 0,
      heuresFerie: 0,
      heuresNuit: 0,

      avancesSurSalaires: 0,
      methodePaiement: this.methodePaiementOptions[0],
      datePaiement:undefined,
    });
  }
}
