import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { EntrepriseParametreRh, EntrepriseParametreRhService } from '../services/entreprise-parametre-rh.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EntrepriseDto } from '../model/entrepriseDto';
import { EntrepriseService } from '../services/entreprise.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service'; // Ajout de l'import

@Component({
  selector: 'app-entreprise-parametre-rh-list',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './entreprise-parametre-rh-list.component.html',
  styleUrl: './entreprise-parametre-rh-list.component.css'
})
export class EntrepriseParametreRhListComponent implements OnInit {

  params: EntrepriseParametreRh[] = [];
  entrepriseId: number | null = null;
  entreprise: EntrepriseDto | null = null;
  error: string | null = null;
  loading = false;

  form!: FormGroup;
  editingParam: EntrepriseParametreRh | null = null;

  @ViewChild('topElement') topElement!: ElementRef;

  private readonly fb = inject(FormBuilder);
  private readonly paramService = inject(EntrepriseParametreRhService);
  private readonly entrepriseService = inject(EntrepriseService);
  private readonly toastService = inject(ToastService); // Injection du service toast

  ngOnInit(): void {
    this.form = this.fb.group({
      cleParametre: [{ value: '', disabled: true }],
      description: [{ value: '', disabled: true }],
      valeurParametre: ['', Validators.required]
    });

    this.entrepriseService.getEntrepriseForEmployeur().subscribe({
      next: (entreprise) => {
        this.entreprise = entreprise;
        this.entrepriseId = entreprise.id!;
        this.loadParams();
      },
      error: () => {
        this.error = "Impossible de charger l'entreprise de l'utilisateur connecté";
        this.toastService.error("Impossible de charger l'entreprise");
      }
    });
  }

  loadParams() {
    if (!this.entrepriseId) return;
    this.loading = true;
    this.paramService.getAll(this.entrepriseId).subscribe({
      next: params => {
        this.params = params;
        this.loading = false;
      },
      error: () => {
        this.error = "Erreur lors du chargement des paramètres RH";
        this.loading = false;
        this.toastService.error("Erreur lors du chargement des paramètres");
      }
    });
  }

  startEdit(param: EntrepriseParametreRh) {
    this.editingParam = param;
    this.form.patchValue(param);
    setTimeout(() => {
      this.topElement?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  cancelEdit() {
    this.editingParam = null;
    this.form.reset();
    this.toastService.info("Modification annulée");
  }

  save() {
    if (!this.editingParam) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning("Veuillez corriger les erreurs du formulaire");
      return;
    }

    this.loading = true;
    const updated: EntrepriseParametreRh = {
      ...this.editingParam,
      valeurParametre: this.form.value.valeurParametre
    };

    this.paramService.update(updated).subscribe({
      next: () => {
        this.toastService.success(`Paramètre "${this.editingParam?.cleParametre}" modifié avec succès !`);
        this.cancelEdit();
        this.loadParams();
        this.loading = false;
      },
      error: () => {
        this.error = "Erreur lors de la mise à jour";
        this.loading = false;
        this.toastService.error("Erreur lors de la sauvegarde du paramètre");
      }
    });
  }
}
