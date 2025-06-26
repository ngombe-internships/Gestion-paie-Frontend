import { HttpStatusCode } from "@angular/common/http";


export interface ApiResponse<T> {
  message: string;
  data: T | null;
  statut: HttpStatusCode;
}
