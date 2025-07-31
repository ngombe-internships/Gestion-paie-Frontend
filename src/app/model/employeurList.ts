export interface EmployeurList {

  entrepriseId: number;
  usernameEmployeur: string;
  nomEntreprise: string;
  dateCreationEntreprise: string
  nombreEmployes: number;
  active: boolean;
  dateCreationSysteme?: string;      // ou Date
  dateDerniereMiseAJour?: string;
}
