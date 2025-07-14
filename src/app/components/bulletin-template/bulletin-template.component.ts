import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BulletinTemplateService } from '../../services/bulletin-template.service';
import { ElementpaieService } from '../../services/elementpaie.service';
import { ElementPaie } from '../../model/elementpaie';
import { BulletinTemplate, TemplateElementPaieConfig } from '../../model/bulletin-template';
import { BulletinPreviewComponent } from "../bulletin-preview/bulletin-preview.component";
import { Employe } from '../../model/employe';
import { CategorieEnum, EchelonEnum, SexeEnum, StatutEmployeEnum, TypeContratEnum } from '../../model/enum/enum';
import { BulletinPaieResponseDto } from '../../services/bulletin.service';

@Component({
  selector: 'app-bulletin-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BulletinPreviewComponent],
  templateUrl: './bulletin-template.component.html',
  styleUrl: './bulletin-template.component.css'
})
export class BulletinTemplateComponent implements OnInit {
  private readonly templateService = inject(BulletinTemplateService);
  private readonly elementPaieService = inject(ElementpaieService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  templates: BulletinTemplate[] = [];
  selectedTemplate: BulletinTemplate | null = null;
  elements: ElementPaie[] = [];

  form: FormGroup;
  loading = false;
  error: string | null = null;

  constructor() {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      isDefault: [false]
    });
  }

  ngOnInit() {
    this.elementPaieService.getAll().subscribe(elements => {
      this.elements = elements;
      this.loadTemplates();
    });
  }
loadTemplates() {
  this.loading = true;
  const entrepriseId = this.authService.getEntrepriseId();
  if (!entrepriseId) {
    this.error = "Impossible de récupérer l'entreprise courante.";
    this.loading = false;
    return;
  }
  this.templateService.getAllByEntreprise(entrepriseId).subscribe({
    next: tpls => {
      this.templates = tpls;
      for (const tpl of this.templates) {
        this.enrichTemplateWithElements(tpl, this.elements);
        console.log('Templates chargés:', this.templates);
        this.initializeDefaultConfigs(tpl);
      }
      // Auto-select le premier si rien de sélectionné
      if (this.templates.length && !this.selectedTemplate) {
        this.selectTemplate(this.templates[0]);
      } else if (this.selectedTemplate) {
        // Si le selectedTemplate vient d'être supprimé, on le retire
        const found = this.templates.find(t => t.id === this.selectedTemplate?.id);
        if (!found) this.selectedTemplate = null;
      }
      this.loading = false;
    },
    error: err => {
      this.error = 'Erreur lors du chargement des templates';
      this.loading = false;
    }
  });
}

  initializeDefaultConfigs(template: BulletinTemplate) {


    // Initialise les configs des éléments
    if (template.elementsConfig) {
      template.elementsConfig.forEach(cfg => {
        if (cfg.active === undefined) cfg.active = true;
        if (cfg.affichageOrdre === undefined) cfg.affichageOrdre = 100;
        if (cfg.formuleCalculOverride === undefined) cfg.formuleCalculOverride = 'NOMBRE_BASE_TAUX';
         if (cfg.nombreDefaut === undefined || cfg.nombreDefaut === null) {
        cfg.nombreDefaut = 1;
      }
      });
    }
  }

  enrichTemplateWithElements(template: BulletinTemplate, elements: ElementPaie[]) {
    if (!template?.elementsConfig) return;
    for (const cfg of template.elementsConfig) {
      cfg.elementPaie = elements.find(e => e.id === cfg.elementPaieId);
    }
  }

  selectTemplate(tpl: BulletinTemplate) {
     this.selectedTemplate = tpl;
  // Correction : initialise la formule si non définie
  if (tpl && tpl.elementsConfig) {
    tpl.elementsConfig.forEach(cfg => {
      if (!cfg.formuleCalculOverride && cfg.elementPaie && cfg.elementPaie.formuleCalcul) {
        cfg.formuleCalculOverride = cfg.elementPaie.formuleCalcul;
      }

       if (cfg.nombreDefaut === undefined || cfg.nombreDefaut === null) {
        cfg.nombreDefaut = 1;
      }
    });
  }
  }

  createTemplate() {
    if (this.form.invalid) return;
    const entrepriseId = this.authService.getEntrepriseId();
    if (!entrepriseId) {
      this.error = "Impossible de récupérer l'entreprise courante.";
      return;
    }
    const tpl: BulletinTemplate = {
      nom: this.form.value.nom,
      isDefault: this.form.value.isDefault,
      entrepriseId: entrepriseId,

      elementsConfig: []
    };
    this.templateService.create(tpl).subscribe({
      next: () => {
        this.form.reset();
        this.loadTemplates();
      },
      error: () => this.error = "Erreur lors de la création du template"
    });
  }

  deleteTemplate(tpl: BulletinTemplate) {
  if (!tpl.id) return;
  // if (!confirm('Supprimer ce template ?')) return;
  this.templateService.delete(tpl.id).subscribe({
    next: () => {
      // Si le template supprimé était sélectionné, on le désélectionne
      if (this.selectedTemplate?.id === tpl.id) {
        this.selectedTemplate = null;
      }
      this.loadTemplates(); // Recharge la liste APRÈS suppression
    },
    error: () => this.error = "Erreur lors de la suppression du template"
  });
}

  addElementToTemplate(element: ElementPaie) {


    if (!this.selectedTemplate || !this.selectedTemplate.id || !element) return;
    const config: TemplateElementPaieConfig = {
      elementPaie: element,
      elementPaieId: element.id!,
      active: true,
      nombreDefaut: 1,
      tauxDefaut: null,
      montantDefaut:null,
       formuleCalculOverride: element.formuleCalcul,
      affichageOrdre: 100
    };
    this.templateService.addElement(this.selectedTemplate.id, config).subscribe({
      next: () => {
        this.reloadTemplate(this.selectedTemplate!.id!);
      },
      error: () => this.error = "Erreur lors de l'ajout de l'élément"
    });
   
  }

  removeElementFromTemplate(config: TemplateElementPaieConfig) {
    if (!this.selectedTemplate || !this.selectedTemplate.id) return;
    this.templateService.removeElement(this.selectedTemplate.id, config.elementPaieId).subscribe({
      next: () => this.reloadTemplate(this.selectedTemplate!.id!),
      error: () => this.error = "Erreur lors de la suppression de l'élément"
    });
  }

  updateElementConfig(cfg: TemplateElementPaieConfig) {
  if (!this.selectedTemplate || !this.selectedTemplate.id) return;

   console.log('=== DEBUG updateElementConfig ===');
  console.log('Config reçue:', cfg);
  console.log('nombreDefaut présent?', cfg.nombreDefaut);
  console.log('Objet complet:', JSON.stringify(cfg, null, 2));


  this.templateService.addElement(this.selectedTemplate.id, cfg).subscribe({
    next: () => this.reloadTemplate(this.selectedTemplate!.id!),
    error: () => this.error = "Erreur lors de la mise à jour de la configuration"
  });
}

  saveHeuresConfig() {
    if (!this.selectedTemplate || !this.selectedTemplate.id) return;

    this.templateService.update(this.selectedTemplate.id, this.selectedTemplate).subscribe({
      next: () => {
        console.log('Configuration des heures mise à jour');
      },
      error: () => this.error = "Erreur lors de la mise à jour de la configuration des heures"
    });
  }

  reloadTemplate(id: number) {
    this.templateService.getById(id).subscribe({
      next: tpl => {

        console.log('Template reçu du serveur:', tpl);
      console.log('Elements config:', tpl.elementsConfig);

        this.enrichTemplateWithElements(tpl, this.elements);
        this.initializeDefaultConfigs(tpl);

          console.log('Après initializeDefaultConfigs:', tpl.elementsConfig);

        this.selectedTemplate = tpl;
        // Recharge la liste pour rester synchro
        this.loadTemplates();
      }
    });
  }

  isElementInTemplate(elementId: number | undefined): boolean {
    if (!this.selectedTemplate || !elementId) return false;
    return this.selectedTemplate.elementsConfig.some(cfg => cfg.elementPaieId === elementId);
  }

  trackByElementId(index: number, item: TemplateElementPaieConfig): number {
    return item.elementPaieId;
  }

  setAsDefault(tpl: BulletinTemplate) {
  if (!tpl.id) return;
  this.templateService.setDefault(tpl.id).subscribe({
    next: () => this.loadTemplates(),
    error: () => this.error = 'Erreur lors du changement de template par défaut'
  });
}

  // Employé factice pour la preview
  fakeEmploye: Employe = {
    nom: 'DUPONT',
    prenom: 'Jean',
    poste: 'Développeur',
    numeroCnps: '123456',
    niu: '987654',
    matricule: '',
    email: '',
    adresse: '',
    telephone: '',
    dateEmbauche: '',
    service: '',
    classificationProfessionnelle: StatutEmployeEnum.Employe,
    categorie: CategorieEnum.I,
    echelon: EchelonEnum.A,
    typeContratEnum: TypeContratEnum.CDD,
    dateNaissance: '',
    sexe: SexeEnum.M,
    heuresContractuellesHebdomadaires: 0,
    joursOuvrablesContractuelsHebdomadaires: 0,
    salaireBase: 81016
  };

  // Génère une preview de bulletin à partir du template sélectionné
fakeBulletinFromTemplate(template: BulletinTemplate): BulletinPaieResponseDto {
  const lignesPaie = template.elementsConfig
    .filter(cfg => !!cfg.elementPaie && cfg.active)
    .sort((a, b) => (a.affichageOrdre || 0) - (b.affichageOrdre || 0))
    .map(cfg => {
      const formule = cfg.formuleCalculOverride || cfg.elementPaie?.formuleCalcul;
      let baseCalcul = 0;
      let tauxApplique = 0;
      let montantFinal = 0;

      if (formule === 'MONTANT_FIXE') {
        montantFinal = cfg.montantDefaut ?? 0;
        tauxApplique = 0;
        baseCalcul = 0;
      }
      else if (formule === 'POURCENTAGE_BASE') {
        baseCalcul = this.fakeEmploye.salaireBase ?? 100000;
        tauxApplique = cfg.tauxDefaut ?? 0;
        montantFinal = baseCalcul * tauxApplique;
      }
      else if (formule === 'NOMBRE_BASE_TAUX') {
        const nombre = cfg.nombreDefaut ?? 1;
        const taux = cfg.tauxDefaut ?? 1;
        baseCalcul = nombre * taux;
        montantFinal = baseCalcul;
        tauxApplique = taux;
      }
      // AJOUTE ICI LA GESTION DES NOUVELLES FORMULES :
      else if (formule === 'TAUX_DEFAUT_X_MONTANT_DEFAUT') {
        tauxApplique = cfg.tauxDefaut ?? 0;
        montantFinal = tauxApplique * (cfg.montantDefaut ?? 0);
        baseCalcul = 0; // ou montantFinal si tu veux l'afficher comme base
      }
      else if (formule === 'NOMBRE_X_TAUX_DEFAUT_X_MONTANT_DEFAUT') {
        const nombre = cfg.nombreDefaut ?? 1;
        const taux = cfg.tauxDefaut ?? 0;
        const montant = cfg.montantDefaut ?? 0;
        montantFinal = nombre * taux * montant;
        baseCalcul = montantFinal; // ou nombre * taux si tu veux l'afficher comme base
        tauxApplique = taux;
      }
      else {
        montantFinal = 0;
        tauxApplique = 0;
        baseCalcul = 0;
      }

      return {
        designation: cfg.elementPaie?.designation ?? 'Élément inconnu',
        type: ["GAIN", "RETENUE", "CHARGE_PATRONALE"].includes(cfg.elementPaie?.type ?? "GAIN")
          ? cfg.elementPaie?.type as "GAIN" | "RETENUE" | "CHARGE_PATRONALE"
          : "GAIN",
        nombre: cfg.nombreDefaut ?? 1,
        baseCalcul,
        tauxApplique,
        montantFinal,
      };
    });

  return {
    id: 0,
    lignesPaie,
    employe: this.fakeEmploye,
    salaireImposable: 300000,
    totalRetenuesSalariales: 10000,
    baseCnps: 20000,
    totalChargesPatronales: 15000,
    salaireBrut: 320000,
    coutTotalEmployeur: 335000,
    salaireNetAPayer: 310000,
    avancesSurSalaires: 100,
  };
}
}
