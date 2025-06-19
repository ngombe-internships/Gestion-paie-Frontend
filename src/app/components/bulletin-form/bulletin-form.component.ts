import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BulletinPaieResponseDto, BulletinService } from '../../services/bulletin.service';
import { BulletinPaie } from '../../model/bulletin';
import { BulletinPreviewComponent } from '../bulletin-preview/bulletin-preview.component';
import { EmployeService } from '../../services/employe.service';
import { ActivatedRoute } from '@angular/router';
import { Employe } from '../../model/employe';


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

  private readonly fb = inject (FormBuilder) ;
  private readonly bulletinService = inject(BulletinService) ;
  private readonly route = inject(ActivatedRoute);
  private readonly employeService = inject(EmployeService);

  constructor() {}

  ngOnInit(): void {
    this.initForm();
    this.route.queryParams.subscribe(params => {
      const employeId = params['employeId'];
      if (employeId) {
        this.loadEmployeDetails(employeId);
      }
    });
  }
  private initForm(): void {
    this.formGroup = this.fb.group({

      tauxHoraire: [0, [Validators.required, Validators.min(0.01)]],
      heuresNormal: [0, [Validators.required, Validators.min(0)]],
      heuresSup1: [0, [Validators.min(0)]],
      heuresSup2: [0, [Validators.min(0)]],
      heuresFerie: [0, [Validators.min(0)]],
      heuresNuit: [0, [Validators.min(0)]],
      jourConge: [0, [Validators.min(0)]],
      primeTransport: [0, [Validators.min(0)]],
      primePonctualite: [0, [Validators.min(0)]],
      primeTechnicite: [0, [Validators.min(0)]],
      primeAnciennete: [0, [Validators.min(0)]],
      primeRendement: [0, [Validators.min(0)]],
      autrePrimes: [0, [Validators.min(0)]],
      avantageNature: [0, [Validators.min(0)]]
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
        alert('Erreur lors du chargement des détails de l\'employé.');
      }
    });
  }


  isFieldValid(fieldName: string): boolean {
    const field = this.formGroup.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  submit(event: Event): void {
    event.preventDefault();

    if (this.formGroup.valid) {
      const bulletinData: BulletinPaie = {
        tauxHoraire: this.formGroup.get('tauxHoraire')?.value || 0,
        heuresNormal: this.formGroup.get('heuresNormal')?.value || 0,
        heuresSup1: this.formGroup.get('heuresSup1')?.value || 0,
        heuresSup2: this.formGroup.get('heuresSup2')?.value || 0,
        heuresFerie: this.formGroup.get('heuresFerie')?.value || 0,
        heuresNuit: this.formGroup.get('heuresNuit')?.value || 0,
        jourConge: this.formGroup.get('jourConge')?.value || 0,
        primeTransport: this.formGroup.get('primeTransport')?.value || 0,
        primePonctualite: this.formGroup.get('primePonctualite')?.value || 0,
        primeTechnicite: this.formGroup.get('primeTechnicite')?.value || 0,
        primeAnciennete: this.formGroup.get('primeAnciennete')?.value || 0,
        primeRendement: this.formGroup.get('primeRendement')?.value || 0,
        autrePrimes: this.formGroup.get('autrePrimes')?.value || 0,
        avantageNature: this.formGroup.get('avantageNature')?.value || 0
      };

      console.log('Données envoyées au service:', bulletinData);

      this.bulletinService.calculerBulletin(bulletinData).subscribe({
        next: (response) => {
          this.bulletinCalcule = response.data;
          console.log('Bulletin calculé reçu:', this.bulletinCalcule);
        },
        error: (error) => {
          console.error('Erreur lors du calcul du bulletin:', error);
          alert('Erreur lors du calcul. Vérifiez la console pour plus de détails.');
        }
      });
    } else {
      console.log('Formulaire invalide:', this.formGroup.errors);
      alert('Veuillez corriger les erreurs dans le formulaire.');
    }
  }

  resetForm(): void {
    this.formGroup.reset();
    this.bulletinCalcule = null;
    // Réinitialiser avec des valeurs par défaut
    this.formGroup.patchValue({
      tauxHoraire: 0,
      heuresNormal: 0,
      heuresSup1: 0,
      heuresSup2: 0,
      heuresFerie: 0,
      heuresNuit: 0,
      primeTransport: 0,
      primePonctualite: 0,
      primeTechnicite: 0,
      primeAnciennete: 0,
      primeRendement: 0,
      autrePrimes: 0,
      avantageNature: 0
    });
  }
}
