export type UserRole = 'guest' | 'customer' | 'admin' | 'merchant';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  accessToken: string | null;
}
