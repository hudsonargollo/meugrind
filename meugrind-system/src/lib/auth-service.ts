// Authentication service for MEUGRIND system
import { 
  signIn, 
  signOut, 
  signUp, 
  confirmSignUp, 
  getCurrentUser,
  fetchAuthSession,
  AuthUser
} from 'aws-amplify/auth';
import { User, Permission } from '../types';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  role: 'manager' | 'personal';
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  tokens: {
    accessToken?: string;
    idToken?: string;
  };
}

class AuthService {
  private currentUser: User | null = null;

  // Define role-based permissions
  private readonly rolePermissions: Record<'manager' | 'personal', Permission[]> = {
    manager: [
      { resource: 'events', actions: ['read', 'write', 'delete'] },
      { resource: 'tasks', actions: ['read', 'write', 'delete'] },
      { resource: 'band', actions: ['read', 'write', 'delete'] },
      { resource: 'influencer', actions: ['read', 'write', 'delete'] },
      { resource: 'solar', actions: ['read', 'write', 'delete'] },
      { resource: 'pr', actions: ['read', 'write', 'delete'] },
      { resource: 'pomodoro', actions: ['read', 'write', 'delete'] },
      { resource: 'financials', actions: ['read', 'write', 'delete'] },
      { resource: 'contracts', actions: ['read', 'write', 'delete'] },
      { resource: 'settings', actions: ['read', 'write', 'delete'] },
    ],
    personal: [
      { resource: 'events', actions: ['read'] }, // Limited to non-sensitive events
      { resource: 'tasks', actions: ['read', 'write', 'delete'] },
      { resource: 'band', actions: ['read'] }, // Performance info only
      { resource: 'influencer', actions: ['read'] }, // Content pipeline only
      { resource: 'solar', actions: ['read'] }, // Appointments only
      { resource: 'pr', actions: ['read'] }, // Schedule only
      { resource: 'pomodoro', actions: ['read', 'write', 'delete'] },
      { resource: 'settings', actions: ['read', 'write'] }, // Personal settings only
    ],
  };

  async signIn(credentials: AuthCredentials): Promise<User> {
    try {
      const { isSignedIn } = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      if (isSignedIn) {
        const user = await this.getCurrentUser();
        this.currentUser = user;
        return user;
      }

      throw new Error('Sign in failed');
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error('Invalid credentials');
    }
  }

  async signUp(data: SignUpData): Promise<void> {
    try {
      await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            'custom:role': data.role,
          },
        },
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error('Sign up failed');
    }
  }

  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });
    } catch (error) {
      console.error('Confirmation error:', error);
      throw new Error('Confirmation failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut();
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Sign out failed');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const authUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      // Extract role from custom attributes or default to personal
      const role = this.extractRoleFromSession(session) || 'personal';
      
      const user: User = {
        id: authUser.userId,
        email: authUser.signInDetails?.loginId || '',
        role,
        permissions: this.rolePermissions[role],
        preferences: {
          theme: 'auto',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notifications: {
            email: true,
            push: true,
            focusMode: false,
          },
          privacyShield: {
            enabled: false,
            hidePersonalDetails: true,
            showAsBusy: true,
            allowedViewers: [],
          },
        },
      };

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw new Error('Not authenticated');
    }
  }

  async getAuthSession(): Promise<AuthSession> {
    try {
      const user = await this.getCurrentUser();
      const session = await fetchAuthSession();
      
      return {
        user,
        isAuthenticated: true,
        tokens: {
          accessToken: session.tokens?.accessToken?.toString(),
          idToken: session.tokens?.idToken?.toString(),
        },
      };
    } catch (error) {
      return {
        user: null,
        isAuthenticated: false,
        tokens: {},
      };
    }
  }

  // Check if user has permission for a specific resource and action
  hasPermission(resource: string, action: 'read' | 'write' | 'delete'): boolean {
    if (!this.currentUser) return false;

    const permission = this.currentUser.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  }

  // Get current user without async call (for components)
  getUser(): User | null {
    return this.currentUser;
  }

  // Check if current user is manager
  isManager(): boolean {
    return this.currentUser?.role === 'manager';
  }

  // Check if current user is personal account
  isPersonal(): boolean {
    return this.currentUser?.role === 'personal';
  }

  private extractRoleFromSession(session: any): 'manager' | 'personal' | null {
    try {
      // Extract role from JWT token custom attributes
      const idToken = session.tokens?.idToken;
      if (idToken) {
        const payload = JSON.parse(atob(idToken.toString().split('.')[1]));
        return payload['custom:role'] || null;
      }
      return null;
    } catch (error) {
      console.error('Error extracting role from session:', error);
      return null;
    }
  }
}

export const authService = new AuthService();