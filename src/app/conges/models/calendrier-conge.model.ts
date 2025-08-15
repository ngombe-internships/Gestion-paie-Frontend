export interface CalendrierMoisDto {
  annee: number;
  mois: number;
  nomMois: string;
  effectifTotal: number;
  jours: { [key: string]: JourCalendrierDto }; // ✅ Structure correcte

  absences?: AbsenceJourneeDto[];
  effectifsJournaliers?: EffectifJournalierDto[];
}

export interface JourCalendrierDto {
  date: string;
  presents: number;
  absents: number;
  tauxOccupation: number;
  jourOuvrable: boolean;
  jourFerie: boolean;
  sousEffectif: boolean;
}

export interface AbsenceJourneeDto {
  id: number;
  date: string;
  employeId: number;
  employeNom: string;
  employePrenom: string;
  typeConge: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
}

export interface EffectifJournalierDto {
  date: string;
  effectifTotal: number;
  effectifPresent: number;
  effectifMinimum: number;
  conflitPotentiel: boolean;
  tauxPresence: number;
}
