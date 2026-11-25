import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiAuthService } from './api-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(ApiAuthService);
  const headers = auth.authHeaders();
  if (!headers['Authorization'] || req.headers.has('Authorization')) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: headers,
    }),
  );
};
