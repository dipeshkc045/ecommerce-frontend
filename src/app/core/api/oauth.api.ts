import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import {GlobalApiResponse, LoginResponse} from './types';




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
