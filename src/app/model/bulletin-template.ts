import { ElementPaie } from "./elementpaie";

export interface BulletinTemplate {
  id?: number;
  nom: string;
  isDefault: boolean;
  entrepriseId: number;
  elementsConfig: TemplateElementPaieConfig[];
}



export interface TemplateElementPaieConfig {
  id?: number;
  elementPaie?: ElementPaie;
  elementPaieId: number;
  active: boolean;
  montantDefaut?: number | null; 
  tauxDefaut?: number | null;
  formuleCalculOverride?: string;
  affichageOrdre?: number;
}
