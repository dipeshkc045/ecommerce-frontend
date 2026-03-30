import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { GlobalApiResponse } from './types';
import { LoginResponse } from './user.api';

export type OAuthLoginRequest = {
  token: string;
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';
};

@Injectable({ providedIn: 'root' })
export class OAuthApi {
  private readonly http = inject(HttpClient);

  loginWithGoogle(token: string) {
    return this.http.post<GlobalApiResponse<LoginResponse>>('/user-service/api/oauth/google/login', {
      token,
      provider: 'GOOGLE',
    });
  }

  loginWithFacebook(token: string) {
    return this.http.post<GlobalApiResponse<LoginResponse>>('/user-service/api/oauth/facebook/login', {
      token,
      provider: 'FACEBOOK',
    });
  }

  loginWithApple(token: string) {
    return this.http.post<GlobalApiResponse<LoginResponse>>('/user-service/api/oauth/apple/login', {
      token,
      provider: 'APPLE',
    });
  }
}
