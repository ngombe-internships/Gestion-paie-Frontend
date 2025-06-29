import { Entreprise } from "./entreprise";

export interface BulletinPaie {
  id? : number,
  entreprise?: {id?: number},
  salaireBase?: number,
  tauxHoraire:  number,
  heuresNormal: number,
  heuresSup1?: number,
  heuresSup2 ?: number,
  heuresFerie ?: number,
  heuresNuit? : number,
  primeTransport? : number,
  primePonctualite? : number,
  primeTechnicite ?: number,
  primeAnciennete ?: number,
  primeRendement ?: number,
  autrePrimes ?: number,
  avantageNature? : number,
  salaireBrut ?: number,
  salaireNet? : number,
  totalChargesPatronales?: number,
  cnpsVieillesse ?: number,
  irpp?: number,
  jourConge?:number,
  dateEmbauche?: string;

  periodePaie?: string;
  dateCreationBulletin?: string; // Utilisez string pour la compatibilité avec les dates ISO 8601
  statusBulletin?: 'GÉNÉRÉ' | 'VALIDÉ' | 'ENVOYÉ' | 'ARCHIVÉ' | 'ANNULÉ';
  datePaiement?: string;
  methodePaiement?: string

  employe?: {
    id?: number;
    nom?: string;
    prenom?: string;
    matricule?: string;
  };
}
