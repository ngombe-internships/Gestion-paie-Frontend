export interface SoldeCongeDto {
  employeId: number;
  nom: string;
  prenom: string;
  matricule: string;
  soldeAcquisTotal: number;
  soldeDisponible: number;
  soldePris: number;
  dateEmbauche: string;
  enPeriodeEssai: boolean;
}

export interface HistoriqueCongeDto {
  demandeId: number;
  typeConge: string;
  dateDebut: string;
  dateFin: string;
  joursOuvrablesPris: number;
  dateApprobation: string;
  statut: string;
  raisonRejet?: string;
}

