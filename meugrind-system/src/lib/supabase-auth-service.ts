/**
 * Supabase Authentication Service
 * 
 * Provides comprehensive authentication functionality for the MEUGRIND system
 * including role-based access control, user management, and session handling.
 */

import { supabase, isSupabaseConfigured } from './supabase-config';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface MeugrindUser {
  id: string;
  email: string;
  role: 'manager' | 'personal';
  permissions: string[];
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    autoSync: boolean;
    privacyShield?: boolean;
  };
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: MeugrindUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  role: 'manager' | 'personal';
  firstName?: string;
  lastName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface PasswordResetData {
  email: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone?: string;
  preferences?: Partial<MeugrindUser['preferences']>;
}

class SupabaseAuthService {
  private authStateListeners: ((state: AuthState) => void)[] = [];
  private currentAuthState: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null,
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the auth service and set up session monitoring
   */
  private async initialize() {
    if (!isSupabaseConfigured()) {
      this.updateAuthState({
        user: null,
        session: null,
        loading: false,
        error: 'Supabase not configured',
      });
      return;
    }

    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        this.updateAuthState({
          user: null,
          session: null,
          loading: false,
          error: error.message,
        });
        return;
      }

      // Load user profile if session exists
      let user: MeugrindUser | null = null;
      if (session?.user) {
        user = await this.loadUserProfile(session.user.id);
      }

      this.updateAuthState({
        user,
        session,
        loading: false,
        error: null,
      });

      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        let user: MeugrindUser | null = null;
        if (session?.user) {
          user = await this.loadUserProfile(session.user.id);
        }

        this.updateAuthState({
          user,
          session,
          loading: false,
          error: null,
        });
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateAuthState({
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Load user profile from database
   */
  private async loadUserProfile(userId: string): Promise<MeugrindUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        permissions: data.permissions || [],
        preferences: data.preferences || {
          theme: 'light',
          notifications: true,
          autoSync: true,
        },
        profile: data.profile || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  /**
   * Update auth state and notify listeners
   */
  private updateAuthState(newState: Partial<AuthState>) {
    this.currentAuthState = { ...this.currentAuthState, ...newState };
    this.authStateListeners.forEach(listener => listener(this.currentAuthState));
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentAuthState);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current auth state
   */
  getCurrentAuthState(): AuthState {
    return this.currentAuthState;
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      this.updateAuthState({ loading: true, error: null });

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) {
        this.updateAuthState({ loading: false, error: authError.message });
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        this.updateAuthState({ loading: false, error: 'User creation failed' });
        return { success: false, error: 'User creation failed' };
      }

      // Create user profile in database
      const userProfile: Partial<MeugrindUser> = {
        id: authData.user.id,
        email: data.email,
        role: data.role,
        permissions: data.role === 'manager' ? ['read', 'write', 'admin'] : ['read', 'write'],
        preferences: {
          theme: 'light',
          notifications: true,
          autoSync: true,
          privacyShield: data.role === 'personal',
        },
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      };

      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
          permissions: userProfile.permissions,
          preferences: userProfile.preferences,
          profile: userProfile.profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Auth user was created but profile failed - this is recoverable
      }

      this.updateAuthState({ loading: false });
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      this.updateAuthState({ loading: true, error: null });

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        this.updateAuthState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      // Auth state change will be handled by the listener
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      this.updateAuthState({ loading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) {
        this.updateAuthState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      // Auth state change will be handled by the listener
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Request password reset
   */
  async resetPassword(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const currentUser = this.currentAuthState.user;
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.firstName !== undefined || data.lastName !== undefined || data.avatar !== undefined || data.timezone !== undefined) {
        updateData.profile = {
          ...currentUser.profile,
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
          ...(data.timezone !== undefined && { timezone: data.timezone }),
        };
      }

      if (data.preferences) {
        updateData.preferences = {
          ...currentUser.preferences,
          ...data.preferences,
        };
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Reload user profile
      const updatedUser = await this.loadUserProfile(currentUser.id);
      if (updatedUser) {
        this.updateAuthState({ user: updatedUser });
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.currentAuthState.user;
    return user?.permissions.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: 'manager' | 'personal'): boolean {
    const user = this.currentAuthState.user;
    return user?.role === role || false;
  }

  /**
   * Get current user
   */
  getCurrentUser(): MeugrindUser | null {
    return this.currentAuthState.user;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentAuthState.session;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentAuthState.session && !!this.currentAuthState.user;
  }

  /**
   * Check if auth is loading
   */
  isLoading(): boolean {
    return this.currentAuthState.loading;
  }

  /**
   * Get current auth error
   */
  getError(): string | null {
    return this.currentAuthState.error;
  }

  /**
   * Clear auth error
   */
  clearError(): void {
    this.updateAuthState({ error: null });
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}

// Create singleton instance
export const authService = new SupabaseAuthService();

// Export types and service
export default authService;