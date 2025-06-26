import { HttpEvent, HttpHandler, HttpHandlerFn, HttpInterceptor, HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { Observable } from "rxjs";



export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {

  const authService = inject(AuthService);
  const token = authService.getToken();
  const authEndpoints = ['/api/auth/login'];
  const isAuthEndpoint = authEndpoints.some(endpoint => req.url.includes(endpoint));

    if(token && !isAuthEndpoint) {
       req = req.clone ({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
       });
    }
    return next(req);
}


