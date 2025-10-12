export enum TypeContratEnum {

  CDD = 'CDD',
  CDI = 'CDI',
  STAGE = 'STAGE',

}


export enum EchelonEnum {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D'
}

export enum CategorieEnum {
  I = 'I',
  II = 'II',
  III = 'III',
  IV = 'IV',
  V = 'V'
}

export enum StatutEmployeEnum {
  Employe = 'EMPLOYE',
  CADRE = 'CADRE',
  OUVRIER = 'OUVRIER',
  STAGIAIRE = 'STAGIAIRE'
}

export enum SexeEnum {
  M = 'M',
  F = 'F'
}

export enum FormuleCalculType {
    MONTANT_FIXE,
    NOMBRE_BASE_TAUX, // Ex: heures sup (nombre * taux horaire * taux majoration)
    POURCENTAGE_BASE, // Ex: cotisation (base * taux)
    BAREME, // Ex: IRPP (calcul selon tranches de revenus)
    AUTRE
}
