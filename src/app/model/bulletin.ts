import { Entreprise } from "./entreprise";

export interface BulletinPaie {
  id? : number,
  entreprise?: {id?: number},
  heuresSup?: number,
  heuresFerie ?: number,
  heuresNuit? : number,
 
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
