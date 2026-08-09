import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import {
  CustomerRegistrationRequest,
  GlobalApiResponse,
  LoginRequest,
  LoginResponse,
  RegistrationResponse
} from './types';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);

  customerLogin(request: LoginRequest) {
    return this.http.post<GlobalApiResponse<LoginResponse>>('/user-service/api/customers/login', request);
  }

  customerRegister(request: CustomerRegistrationRequest) {
    return this.http.post<GlobalApiResponse<RegistrationResponse>>(
      '/user-service/api/customers/register',
      request
    );
  }
}
