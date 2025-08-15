export interface DemandeCongeCreateDto {
  employeId: number;
  typeConge: TypeConge;
  dateDebut: string;
  dateFin: string;
  raison?: string;
  documentsJustificatifs?: string[];
  lienFamilial?: string;
  certificatMedical?: string;
}

export interface DemandeCongeResponseDto {
  id: number;
  employeId: number;
  employeNom: string;
  employePrenom: string;
  typeConge: TypeConge;
  dateDebut: string;
  dateFin: string;
  dateDemande: string;
  statut: StatutDemandeConge;
  raison?: string;
  motifRejet?: string;
  approuveeParId?: number;
  dateApprobationRejet?: string;
  documentsJustificatifs?: string[];
}

export enum TypeConge {
  CONGE_PAYE = 'CONGE_PAYE',
  CONGE_MALADIE = 'CONGE_MALADIE',
  CONGE_MATERNITE = 'CONGE_MATERNITE',
  CONGE_PATERNITE = 'CONGE_PATERNITE',
  CONGE_SANS_SOLDE = 'CONGE_SANS_SOLDE',
  CONGE_FORMATION = 'CONGE_FORMATION',
  CONGE_DEUIL = 'CONGE_DEUIL'
}

export enum StatutDemandeConge {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVEE = 'APPROUVEE',
  REJETEE = 'REJETEE',
  ANNULEE = 'ANNULEE'
}

export interface DocumentDto {
    id: number;
    nom: string;
    type: string;
    contentType: string;
    taille: number;
    dateUpload: string;
    uploadedBy: string;
    url: string; // URL Cloudinary
    publicId?: string; // Optionnel - ID Cloudinary
}

// Énumération des types de documents possibles
export enum TypeDocument {
    CERTIFICAT_MEDICAL = 'CERTIFICAT_MEDICAL',
    ACTE_NAISSANCE = 'ACTE_NAISSANCE',
    ACTE_MARIAGE = 'ACTE_MARIAGE',
    ACTE_DECES = 'ACTE_DECES',
    JUSTIFICATIF_FAMILLE = 'JUSTIFICATIF_FAMILLE'
}

// Interface pour les détails d'un document uploadé
export interface UploadedDocument {
    success: boolean;
    url: string;
    publicId: string;
    message?: string;
}
