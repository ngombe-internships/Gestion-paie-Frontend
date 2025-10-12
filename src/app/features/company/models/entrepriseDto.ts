export interface EntrepriseDto {
  id?: number; // Optionnel car peut être null pour la création
  nom: string;
  adresseEntreprise: string;
  emailEntreprise: string;
  telephoneEntreprise: string;
  numeroSiret?: string;
  logoUrl?: string | null;
  dateCreation?: string | Date | null;
  active: boolean;
  dateCreationSysteme?: string | Date;
  dateDerniereMiseAJour?: string | Date;

}
