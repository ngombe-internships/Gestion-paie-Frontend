export interface CreateEmployerAndCompanyDto {
  username?: string;
  password?: string;
  nomEntreprise?: string;
  adresseEntreprise?: string;
  numeroSiret?: string;
  emailEntreprise?: string;
  telephoneEntreprise?: string;
  dateCreation?: string; // Ou Date, selon votre besoin
}
