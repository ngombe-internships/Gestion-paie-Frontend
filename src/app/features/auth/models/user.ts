import { Entreprise } from "../../company/models/entreprise";

export interface User {
  id?: number;
  username?: string;
  role?: string;
  displayName?: string;
  entreprise?: Entreprise;

}
