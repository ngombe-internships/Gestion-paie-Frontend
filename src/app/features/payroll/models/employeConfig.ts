export interface EmployePaieConfig {
  id?: number;
  employe:number;
  elementPaie: number;
  nombre?: number | null;
  montant?: number | null;
  taux?: number | null;
  dateDebut: string;
  dateFin?:string | null
}
