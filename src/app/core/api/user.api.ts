import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { GlobalApiResponse } from './types';

export type LoginResponse = {
  userId: string | null;
  email: string | null;
  userType: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number | null;
  requiresVerification: boolean | null;
  requiresKycVerification: boolean | null;
};

export type LoginRequest = {
  emailOrPhone: string;
  password: string;
};

export type CustomerRegistrationRequest = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type RegistrationResponse = {
  userId: string;
  email: string;
  userType: string;
  status: string;
  message: string;
  requiresEmailVerification: boolean | null;
  requiresPhoneVerification: boolean | null;
  requiresKycVerification: boolean | null;
};

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
