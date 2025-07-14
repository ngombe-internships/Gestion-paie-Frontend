export interface TemplateElementPaieConfigDto {
  id?: number;
  elementPaieId: number; // ID de l’élément de paie sélectionné
  valeurDefaut: number;
  isActive: boolean;
  formuleCalculOverride?: string;
  affichageOrdre?: number;
}
