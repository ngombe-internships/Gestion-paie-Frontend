import { CategorieEnum, EchelonEnum, SexeEnum, StatutEmployeEnum, TypeContratEnum } from "./enum";

export interface EmployeCreate {

  matricule : string;
  nom : string;
  prenom : string;
  numeroCnps: string;
  niu : string;
  email : string;
  adresse : string;
  telephone : string;
  dateEmbauche : string;
  poste : string;
  service : string;
  classificationProfessionnelle : StatutEmployeEnum;
  categorie : CategorieEnum;
  echelon : EchelonEnum;
  typeContratEnum : TypeContratEnum;
  dateNaissance : string;
  sexe : SexeEnum;
  heuresContractuellesHebdomadaires: number;
  joursOuvrablesContractuelsHebdomadaires: number;
  salaireBase: number;
  avantagesNature?: string[];
}
