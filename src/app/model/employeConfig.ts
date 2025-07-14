export interface EmployePaieConfig {
  id?: number;
  employe:number;
  elementPaie: number;
  montant?: number | null; 
  taux?: number | null;
  dateDebut: string;
  dateFin?:string | null
}
