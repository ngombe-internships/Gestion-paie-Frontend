export interface JourFerieDto {
  id: number;
  nom: string;
  date: string;
  entrepriseId: number;
  annuel: boolean;
  actif: boolean;
}

export interface JourFerieRequestDto {
  nom: string;
  date: string;
  annuel: boolean;
  actif?: boolean;
}

export interface JourFerieUpdateDto {
  id: number;
  nom: string;
  date: string;
  annuel: boolean;
  actif: boolean;
}
