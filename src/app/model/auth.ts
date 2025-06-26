export interface LoginRequest {
  username? : string;
  password? : string;
}

export interface RegisterRequest {
  username? : string;
  password?: string;
  employeId? : number;
}

export interface AuthResponse {
  accessToken?: string;
  tokenType? : string;
}
