export interface RegisterDto {
  username: string;
  password: string;
  employeId?: number;

  nomEntreprise:string;
  adresseEntreprise:string;
  telephoneEntreprise?:string;
  emailEntreprise?:string;
  numeroSiret: string;
  dateCreation:string
}



