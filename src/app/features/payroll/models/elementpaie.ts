export interface ElementPaie {
  id?: number;
  code: string;
  type: string; // GAIN, RETENUE, CHARGE_PATRONALE...
  formuleCalcul: string; // MONTANT_FIXE, NOMBRE_BASE_TAUX, etc.
  tauxDefaut?: number;
  uniteBaseCalcul?: string;
  categorie: string;
  designation: string;
  

  impacteSalaireBrut?: boolean;
  impacteBaseCnps?: boolean;
  impacteBaseIrpp?: boolean;
  impacteSalaireBrutImposable?: boolean;
  impacteBaseCreditFoncier?: boolean;
  impacteBaseAnciennete?: boolean;
  impacteNetAPayer?: boolean;
}
