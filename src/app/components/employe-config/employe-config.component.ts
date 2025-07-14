import { routes } from '../../app.routes';
import { ElementpaieService } from '../../services/elementpaie.service';
import { ElementPaie } from '../../model/elementpaie';
import { EmployePaieConfigService } from '../../services/employe-paie-config.service';
import { EmployePaieConfig } from '../../model/employeConfig';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employe } from '../../model/employe';
import { EmployeService } from '../../services/employe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employe-config',
  imports: [FormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './employe-config.component.html',
  styleUrl: './employe-config.component.css'
})
export class EmployeConfigComponent implements OnInit {


  employePaieConfigForm!: FormGroup;
  employes: Employe[] =[];
  elementPaies: ElementPaie[] = [];
  configId: number | null = null;
  selectedFormula: string = '';


  private readonly fb  = inject(FormBuilder);
  private readonly employePaieConfigService = inject(EmployePaieConfigService);
  private readonly employeService = inject(EmployeService);
  private readonly elementpaieService = inject(ElementpaieService);
  private readonly  route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.configId = +id;
        this.loadEmployePaieConfig(this.configId);
      }
    });
    // Dynamique: maj la formule quand le select change
      this.employePaieConfigForm.get('elementPaie')?.valueChanges.subscribe(value => {
     const element = this.elementPaies.find(e => e.id === value);
     this.selectedFormula = element?.formuleCalcul || '';
    // Reset les champs
     this.employePaieConfigForm.patchValue({ montant: null, taux: null });
    // Validation dynamique
    if (this.selectedFormula === 'MONTANT_FIXE') {
  this.employePaieConfigForm.get('montant')?.setValidators([Validators.required, Validators.min(0)]);
  this.employePaieConfigForm.get('taux')?.clearValidators();
  this.employePaieConfigForm.get('nombre')?.clearValidators();
} else if (this.selectedFormula === 'POURCENTAGE_BASE') {
  this.employePaieConfigForm.get('taux')?.setValidators([Validators.required, Validators.min(0)]);
  this.employePaieConfigForm.get('montant')?.clearValidators();
  this.employePaieConfigForm.get('nombre')?.clearValidators();
} else if (this.selectedFormula === 'TAUX_DEFAUT_X_MONTANT_DEFAUT') {
  this.employePaieConfigForm.get('taux')?.setValidators([Validators.required, Validators.min(0)]);
  this.employePaieConfigForm.get('montant')?.setValidators([Validators.required, Validators.min(0)]);
  this.employePaieConfigForm.get('nombre')?.clearValidators();
} else if (this.selectedFormula === 'NOMBRE_X_TAUX_DEFAUT_X_MONTANT_DEFAUT') {
  this.employePaieConfigForm.get('nombre')?.setValidators([Validators.required, Validators.min(0)]);
  this.employePaieConfigForm.get('taux')?.setValidators([Validators.required, Validators.min(0)]);
  this.employePaieConfigForm.get('montant')?.setValidators([Validators.required, Validators.min(0)]);
} else {
  this.employePaieConfigForm.get('montant')?.clearValidators();
  this.employePaieConfigForm.get('taux')?.clearValidators();
  this.employePaieConfigForm.get('nombre')?.clearValidators();
  }
  this.employePaieConfigForm.get('montant')?.updateValueAndValidity();
 this.employePaieConfigForm.get('taux')?.updateValueAndValidity();
 this.employePaieConfigForm.get('nombre')?.updateValueAndValidity();
 });
 }

  initForm(): void {
    this.employePaieConfigForm = this.fb.group({
       employe:[{value:'', disable: !!this.configId}, Validators.required],
       elementPaie:[{value:'', disable: !!this.configId}, Validators.required],
       montant:[null],
       taux:[null],
       nombre: [null],
       dateDebut:['',Validators.required],
       dateFin:['']
      });
  }

  loadDropdowns(): void {
    this.employeService.getAllEmployes().subscribe(
      data => this.employes = data,
      error => console.error('Erreur lors du chargement des employés', error)
    );

    this.elementpaieService.getAll().subscribe(
      data => this.elementPaies = data,
      error => console.error('Erreur lors du chargement des éléments de paie', error)
    );
  }


  loadEmployePaieConfig(id:number): void {
    this.employePaieConfigService.getEmployePaieConfigById(id).subscribe(
      config =>{
        this.employePaieConfigForm.patchValue ({
          employe:config.employe,
          elementPaie: config.elementPaie,
          montant:[null],
          taux:[null],
          nombre: [null],
          dateDebut:config.dateDebut,
          dateFin: config.dateFin || ''
        });
      },
      error => console.error('Erreur lors du changement de la configuration', error)
    );
  }

  onSubmit(): void {
    if(this.employePaieConfigForm.valid) {
      const formValue = this.employePaieConfigForm.getRawValue();
      const config: EmployePaieConfig = {
        id: this.configId || undefined,
        employe:formValue.employe,
        elementPaie: formValue.elementPaie,
        montant: this.selectedFormula === 'MONTANT_FIXE' ? formValue.montant : null,
        taux: this.selectedFormula === 'POURCENTAGE_BASE' ? formValue.taux : null,
        nombre:formValue.nombre,
        dateDebut:formValue.dateDebut,
        dateFin: formValue.dateFin || null
      };

      if (this.configId) {
        this.employePaieConfigService.updateEmployePaieConfig(this.configId, config).subscribe(
          () =>{
          this.toastrService.success('Configuration mise a jour avec succés !');
          this.router.navigate(['/dashboard/employe-paie-config']);
          },
          error => console.error('Erreur lors de la mise a jour', error)
        );
      } else {
        this.employePaieConfigService.createEmployePaieConfig(config.employe, config.elementPaie, config).subscribe(
          ()=> {
           this.toastrService.success('Configuration cree avec succés!');
           this.router.navigate(['/dashboard/employe-paie-config']);
          },
          error => console.error('Erreur lors de la creation', error)
        );
      }
    } else {
      this.toastrService.error('Veillez remplir tout les champs obligatoirs.');
    }


  }

  onCancel(): void{
      this.router.navigate(['/dashboard/employe-paie-config']);
  }
}








