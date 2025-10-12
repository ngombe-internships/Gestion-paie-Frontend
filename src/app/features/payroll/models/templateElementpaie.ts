export interface TemplateElementPaieConfigDto {
  id?: number;
  elementPaieId: number; // ID de l’élément de paie sélectionné
  nombreDefaut?: number;
   tauxDefaut?: number;
  montantDefaut?: number;
  isActive: boolean;
  formuleCalculOverride?: string;
  affichageOrdre?: number;
}
