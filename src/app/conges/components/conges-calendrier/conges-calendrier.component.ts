import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { CalendrierCongeService } from '../../services/calendrier-conge.service';
import { JourFerieService, JourFerieDto } from '../../services/jour-ferie.service';
import {
  CalendrierMoisDto,
  JourCalendrierDto,
  AbsenceJourneeDto,
  EffectifJournalierDto
} from '../../models/calendrier-conge.model';

@Component({
  selector: 'app-conges-calendrier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conges-calendrier.component.html',
  styleUrls: ['./conges-calendrier.component.css']
})
export class CongesCalendrierComponent implements OnInit, OnDestroy {

  // État du calendrier
  calendrierData: CalendrierMoisDto | null = null;
  joursData: { [key: string]: JourCalendrierDto } = {};
  absences: AbsenceJourneeDto[] = [];
  effectifs: EffectifJournalierDto[] = [];
  conflitsPotentiels: EffectifJournalierDto[] = [];

  // Navigation temporelle
  currentDate = new Date();
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  // États
  isLoading = true;
  error: string | null = null;

  // Vue active
  currentView: 'calendrier' | 'effectifs' | 'conflits' = 'calendrier';

  // Données additionnelles
  joursFeries: JourFerieDto[] = [];
  joursFeriesMap: Map<string, JourFerieDto> = new Map();
  demandesEnAttente: AbsenceJourneeDto[] = [];

  // État pour l'affichage des détails
  showDetailsFor: number | null = null;

  private destroy$ = new Subject<void>();
  public readonly authService = inject(AuthService);
  public readonly calendrierService = inject(CalendrierCongeService);
  public readonly jourFerieService = inject(JourFerieService);

  // Constantes pour l'affichage
  readonly MOIS_NOMS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  readonly JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  constructor() {}

  ngOnInit(): void {
    if (this.authService.hasRole('EMPLOYEUR') || this.authService.isAdmin()) {
      this.loadCalendrierData();
      this.loadJoursFeries();
      this.loadDemandesEnAttente();
      this.loadConflitsPotentiels();
    } else {
      this.error = 'Accès non autorisé. Vous devez être employeur pour voir cette page.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ CHARGEMENT AMÉLIORÉ avec jours fériés
   */
  loadCalendrierData(): void {
    this.isLoading = true;
    this.error = null;

    // Reset des données
    this.calendrierData = null;
    this.joursData = {};
    this.effectifs = [];
    this.absences = [];


    // Chargement parallèle des données disponibles
    forkJoin({
      calendrier: this.calendrierService.getCalendrierMensuel(this.selectedYear, this.selectedMonth),
      absences: this.calendrierService.getAbsencesMensuelles(this.selectedYear, this.selectedMonth)
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {

          // Traitement du calendrier principal
          if (responses.calendrier.status === 'OK' && responses.calendrier.data) {
            this.calendrierData = responses.calendrier.data;
            this.joursData = responses.calendrier.data.jours || {};
            this.convertirEffectifs();

          }

          // Traitement des absences détaillées
          if (responses.absences.status === 'OK' && responses.absences.data) {
            this.absences = responses.absences.data;
          } else {
            this.convertirAbsences();
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur chargement calendrier:', error);
          this.error = error.message || 'Erreur lors du chargement du calendrier.';
          this.joursData = {};
          this.effectifs = [];
          this.absences = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * NOUVEAU : Chargement des jours fériés
   */
  loadJoursFeries(): void {
    this.jourFerieService.getAllJoursFeries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'OK' && response.data) {
            this.joursFeries = response.data;

            // Créer une map pour un accès rapide par date
            this.joursFeriesMap.clear();
            this.joursFeries.forEach(ferie => {
              this.joursFeriesMap.set(ferie.dateFerie, ferie);
            });

          }
        },
        error: (error) => {
         // console.warn('⚠️ Erreur chargement jours fériés:', error);
        }
      });
  }

  /**
   * Vérifie si une date est fériée et retourne les informations
   */
  getJourFerieInfo(dateStr: string): JourFerieDto | null {
    return this.joursFeriesMap.get(dateStr) || null;
  }

  /**
   * Conversion des données jours vers effectifs
   */
  private convertirEffectifs(): void {
    this.effectifs = [];

    if (!this.joursData) return;

    Object.keys(this.joursData).forEach(jourKey => {
      const jour = this.joursData[jourKey];
      if (jour && jour.jourOuvrable) {
        const effectif: EffectifJournalierDto = {
          date: jour.date,
          effectifTotal: this.calendrierData?.effectifTotal || 0,
          effectifPresent: jour.presents,
          effectifMinimum: Math.ceil((this.calendrierData?.effectifTotal || 0) * 0.7),
          conflitPotentiel: jour.sousEffectif,
          tauxPresence: jour.tauxOccupation
        };

        this.effectifs.push(effectif);
      }
    });

  }

  /**
   * Conversion/simulation des absences détaillées
   */
  private convertirAbsences(): void {
    // Si on a déjà des absences chargées depuis l'API, ne pas simuler
    if (this.absences && this.absences.length > 0) {
      return;
    }

    this.absences = [];

    if (!this.joursData) return;

    const nomsEmployes = [
      { nom: 'Dupont', prenom: 'Marie' },
      { nom: 'Martin', prenom: 'Pierre' },
      { nom: 'Bernard', prenom: 'Sophie' },
      { nom: 'Dubois', prenom: 'Jean' },
      { nom: 'Thomas', prenom: 'Claire' },
      { nom: 'Robert', prenom: 'Paul' },
      { nom: 'Petit', prenom: 'Anne' },
      { nom: 'Durand', prenom: 'Michel' }
    ];

    const typesConges = ['CONGE_PAYE', 'CONGE_MALADIE', 'RTT', 'CONGE_MATERNITE'];

    Object.keys(this.joursData).forEach(jourKey => {
      const jour = this.joursData[jourKey];
      if (jour && jour.absents > 0) {
        for (let i = 0; i < jour.absents; i++) {
          const employeIndex = (parseInt(jourKey) + i) % nomsEmployes.length;
          const employe = nomsEmployes[employeIndex];
          const typeIndex = i % typesConges.length;

          const absence: AbsenceJourneeDto = {
            id: parseInt(jourKey) * 1000 + i,
            date: jour.date,
            employeId: employeIndex + 1,
            employeNom: employe.nom,
            employePrenom: employe.prenom,
            typeConge: typesConges[typeIndex],
            statut: 'APPROUVEE',
            dateDebut: jour.date,
            dateFin: jour.date
          };

          this.absences.push(absence);
        }
      }
    });

    console.log(`📋 ${this.absences.length} absences simulées`);
  }

  /**
   * ✅ GÉNÉRATION AMÉLIORÉE des jours du mois
   */
  getJoursDuMois(): any[] {
    const firstDay = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    const lastDay = new Date(this.selectedYear, this.selectedMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const jours = [];

    // Jours vides du début (mois précédent)
    for (let i = 0; i < startDayOfWeek; i++) {
      jours.push({
        jour: null,
        isCurrentMonth: false,
        absences: [],
        effectif: null,
        nombreAbsents: 0,
        isConflict: false,
        isToday: false,
        isWeekend: false,
        jourData: null,
        jourFerieInfo: null
      });
    }

    // Jours du mois courant
    for (let jour = 1; jour <= daysInMonth; jour++) {
      const dateStr = `${this.selectedYear}-${this.selectedMonth.toString().padStart(2, '0')}-${jour.toString().padStart(2, '0')}`;

      // Récupération des données du jour
      const jourData = this.joursData[jour.toString()] || null;

      // Vérification si c'est un jour férié
      const jourFerieInfo = this.getJourFerieInfo(dateStr);

      // Filtrage des absences pour ce jour
      const absencesJour = this.absences.filter(a => a && a.date === dateStr);

      // Recherche de l'effectif pour ce jour
      const effectifJour = this.effectifs.find(e => e && e.date === dateStr) || null;

      jours.push({
        jour,
        date: dateStr,
        isCurrentMonth: true,
        isToday: this.isToday(this.selectedYear, this.selectedMonth, jour),
        isWeekend: this.isWeekend(this.selectedYear, this.selectedMonth, jour),
        absences: absencesJour,
        effectif: effectifJour,
        nombreAbsents: absencesJour.length,
        isConflict: jourData?.sousEffectif || false,
        jourData: jourData,
        jourFerieInfo: jourFerieInfo, // ✅ Informations du jour férié
        tauxOccupation: jourData?.tauxOccupation || 0,
        presents: jourData?.presents || 0,
        absents: jourData?.absents || 0
      });
    }

    return jours;
  }

  /**
   * Charge les demandes en attente
   */
  loadDemandesEnAttente(): void {
    this.calendrierService.getDemandesEnAttente()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'OK' && response.data) {
            this.demandesEnAttente = response.data;
          }
        },
        error: (error) => {
          console.error('❌ Erreur demandes en attente:', error);
        }
      });
  }

  /**
   * Charge les conflits potentiels
   */
  loadConflitsPotentiels(): void {
    this.calendrierService.detecterConflitsPotentiels(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'OK' && response.data) {
            this.conflitsPotentiels = response.data;
          }
        },
        error: (error) => {
          console.error('❌ Erreur conflits:', error);
        }
      });
  }

  /**
   * Change le mois/année
   */
  changerMois(direction: 'prev' | 'next'): void {
    if (direction === 'prev') {
      if (this.selectedMonth === 1) {
        this.selectedMonth = 12;
        this.selectedYear--;
      } else {
        this.selectedMonth--;
      }
    } else {
      if (this.selectedMonth === 12) {
        this.selectedMonth = 1;
        this.selectedYear++;
      } else {
        this.selectedMonth++;
      }
    }

    this.loadCalendrierData();
  }

  /**
   * Va au mois actuel
   */
  allerAujourdhui(): void {
    const today = new Date();
    this.selectedMonth = today.getMonth() + 1;
    this.selectedYear = today.getFullYear();
    this.loadCalendrierData();
  }

  /**
   * Vérifie si c'est aujourd'hui
   */
  isToday(year: number, month: number, day: number): boolean {
    const today = new Date();
    return today.getFullYear() === year &&
           today.getMonth() + 1 === month &&
           today.getDate() === day;
  }

  /**
   * Vérifie si c'est un weekend
   */
  isWeekend(year: number, month: number, day: number): boolean {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0 || date.getDay() === 6;
  }

  /**
   * Change la vue active
   */
  changerVue(vue: 'calendrier' | 'effectifs' | 'conflits'): void {
    this.currentView = vue;
  }

  /**
   * Exporte le calendrier
   */
  exporterCalendrier(): void {
    this.calendrierService.exporterCalendrier(this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const blob = new Blob([data], { type: 'text/calendar' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `calendrier-conges-${this.selectedYear}.ics`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('❌ Erreur export:', error);
        }
      });
  }

  /**
   * Rafraîchit les données
   */
  refresh(): void {
    this.loadCalendrierData();
    this.loadJoursFeries();
    this.loadDemandesEnAttente();
    this.loadConflitsPotentiels();
  }

  /**
   * Obtient le nom du mois
   */
  get nomMoisCourant(): string {
    return this.calendrierData?.nomMois || this.MOIS_NOMS[this.selectedMonth - 1];
  }

  /**
   * ✅ MÉTHODES UTILITAIRES AMÉLIORÉES
   */

  /**
   * Toggle l'affichage des détails pour un jour
   */
  toggleDetails(jour: number): void {
    this.showDetailsFor = this.showDetailsFor === jour ? null : jour;
  }

  /**
   * Obtient les absences pour un jour spécifique
   */


  /**
   * ✅ Classes CSS améliorées pour les jours
   */
  getJourClassSimple(jour: any): string {
    if (!jour.jour) return 'calendar-cell empty';

    const classes = ['calendar-cell', 'day'];

    if (jour.isToday) classes.push('today');
    if (jour.isWeekend) classes.push('weekend');
    if (jour.jourFerieInfo) classes.push('ferie'); // ✅ Utilise les vraies données
    if (jour.jourData?.absents > 0) classes.push('with-absences');
    if (jour.jourData?.sousEffectif) classes.push('sous-effectif');

    return classes.join(' ');
  }

  /**
   * ✅ Vérifie si on doit afficher les présents (pas si tout le monde est là)
   */
  shouldShowPresents(jour: any): boolean {
    if (!jour.jourData || !jour.jourData.jourOuvrable) return false;

    const effectifTotal = this.calendrierData?.effectifTotal || 0;
    return jour.jourData.presents < effectifTotal;
  }

  /**
   * Compte le nombre total d'absences du mois
   */
  getTotalAbsencesMois(): number {
    return Object.values(this.joursData)
      .filter(jour => jour.jourOuvrable)
      .reduce((total, jour) => total + jour.absents, 0);
  }

  /**
   * Compte les jours à risque
   */
  getJoursRisque(): number {
    return Object.values(this.joursData)
      .filter(jour => jour.jourOuvrable && jour.sousEffectif).length;
  }

  /**
   * Compte les demandes en attente
   */
  getDemandesEnAttenteCount(): number {
    return this.demandesEnAttente ? this.demandesEnAttente.length : 0;
  }

  /**
   * ✅ Compte les jours fériés du mois RÉELS
   */
  getJoursFeriesCount(): number {
    const currentMonthStart = `${this.selectedYear}-${this.selectedMonth.toString().padStart(2, '0')}-01`;
    const currentMonthEnd = `${this.selectedYear}-${this.selectedMonth.toString().padStart(2, '0')}-31`;

    return this.joursFeries.filter(ferie =>
      ferie.dateFerie >= currentMonthStart &&
      ferie.dateFerie <= currentMonthEnd
    ).length;
  }

  /**
   * Calcul des jours ouvrables
   */
  getJoursOuvrables(): number {
    const joursOuvrablesAPI = Object.values(this.joursData).filter(jour => jour.jourOuvrable).length;
    const joursOuvrablesCalcules = this.calculerJoursOuvrablesManuel();

    return joursOuvrablesAPI > 0 ? joursOuvrablesAPI : joursOuvrablesCalcules;
  }

  /**
   * Calcul manuel des jours ouvrables
   */
  private calculerJoursOuvrablesManuel(): number {
    const lastDay = new Date(this.selectedYear, this.selectedMonth, 0);
    const daysInMonth = lastDay.getDate();
    let joursOuvrables = 0;

    for (let jour = 1; jour <= daysInMonth; jour++) {
      const date = new Date(this.selectedYear, this.selectedMonth - 1, jour);
      const dayOfWeek = date.getDay();

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        joursOuvrables++;
      }
    }

    return joursOuvrables;
  }

  getEffectifTotalConfigures(): number {
    return this.calendrierData?.effectifTotal || 0;
  }

  getConflitsDuMois(): JourCalendrierDto[] {
    return Object.values(this.joursData).filter(jour =>
      jour.jourOuvrable && jour.sousEffectif
    );
  }

  analyserJour(jour: JourCalendrierDto): void {
    const details = {
      date: jour.date,
      presents: jour.presents,
      absents: jour.absents,
      tauxOccupation: jour.tauxOccupation,
      effectifTotal: this.calendrierData?.effectifTotal,
      deficit: (this.calendrierData?.effectifTotal || 0) - jour.presents
    };

    alert(`Analyse du ${jour.date}:\n` +
          `Présents: ${details.presents}\n` +
          `Absents: ${details.absents}\n` +
          `Déficit: ${details.deficit} personne(s)\n` +
          `Taux: ${details.tauxOccupation}%`);
  }

  getTypeCongeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'CONGE_PAYE': 'Congé payé',
      'CONGE_MALADIE': 'Maladie',
      'CONGE_MATERNITE': 'Maternité',
      'CONGE_PATERNITE': 'Paternité',
      'CONGE_SANS_SOLDE': 'Sans solde',
      'RTT': 'RTT',
      'FORMATION': 'Formation'
    };

    return types[type] || type;
  }

  getStatutBadgeClass(effectif: EffectifJournalierDto): string {
    return effectif.effectifPresent >= effectif.effectifMinimum ? 'bg-success' : 'bg-danger';
  }

  getStatutIconClass(effectif: EffectifJournalierDto): string {
    return effectif.effectifPresent >= effectif.effectifMinimum ? 'bi-check-circle' : 'bi-exclamation-triangle';
  }

  getStatutLabel(effectif: EffectifJournalierDto): string {
    return effectif.effectifPresent >= effectif.effectifMinimum ? 'OK' : 'Risque';
  }

  getAbsentsCount(effectif: EffectifJournalierDto): number {
    return effectif.effectifTotal - effectif.effectifPresent;
  }

  getDeficitJour(jour: JourCalendrierDto): number {
    const effectifTotal = this.getEffectifTotalConfigures();
    return Math.max(0, effectifTotal - jour.presents);
  }

  getAbsencesJour(jour: any): AbsenceJourneeDto[] {
  // 🔧 CORRECTION: Utiliser jour.date directement
  if (!jour.date) return [];

  console.log(`🔍 Recherche absences pour: ${jour.date}`);

  const absencesJour = this.absences.filter(a => a && a.date === jour.date);

  console.log(`✅ Trouvé ${absencesJour.length} absence(s)`);
  return absencesJour;
}

}
