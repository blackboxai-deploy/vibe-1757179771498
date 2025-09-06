// Firebase configuration and services for Balloon Pop Ultimate

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc, setDoc, DocumentData } from 'firebase/firestore';
import { FirebaseConfig, UserData } from '@/types/game';

class FirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private currentUser: User | null = null;
  private appId: string = '';

  async initialize(config: FirebaseConfig, appId: string, initialAuthToken?: string): Promise<void> {
    try {
      this.appId = appId;
      this.app = initializeApp(config);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);

      // Sign in with custom token if provided, otherwise use anonymous
      if (initialAuthToken) {
        await signInWithCustomToken(this.auth, initialAuthToken);
      } else {
        await signInAnonymously(this.auth);
      }

      this.currentUser = this.auth.currentUser;
      
      if (!this.currentUser) {
        throw new Error('Failed to authenticate user');
      }

      console.log('Firebase initialized successfully for user:', this.currentUser.uid);
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      // Fallback to guest mode
      this.currentUser = {
        uid: 'guest-' + Math.random().toString(36).substring(2, 9)
      } as User;
    }
  }

  getCurrentUserId(): string {
    if (!this.currentUser) {
      return 'guest-' + Math.random().toString(36).substring(2, 9);
    }
    return this.currentUser.uid;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isGuest(): boolean {
    return this.currentUser?.uid.startsWith('guest-') || false;
  }

  async saveHighScore(score: number): Promise<boolean> {
    if (!this.db || !this.currentUser || this.isGuest()) {
      // Store locally for guest users
      localStorage.setItem('balloonpop_highscore', score.toString());
      return true;
    }

    try {
      const userDocRef = doc(this.db, `artifacts/${this.appId}/users/${this.currentUser.uid}/gameData`, 'highScore');
      await setDoc(userDocRef, { 
        score,
        timestamp: new Date().toISOString(),
        userId: this.currentUser.uid
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Failed to save high score:', error);
      // Fallback to local storage
      localStorage.setItem('balloonpop_highscore', score.toString());
      return false;
    }
  }

  async getHighScore(): Promise<number> {
    if (!this.db || !this.currentUser || this.isGuest()) {
      // Get from local storage for guest users
      const localScore = localStorage.getItem('balloonpop_highscore');
      return localScore ? parseInt(localScore, 10) : 0;
    }

    try {
      const userDocRef = doc(this.db, `artifacts/${this.appId}/users/${this.currentUser.uid}/gameData`, 'highScore');
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
        return data.score || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get high score:', error);
      // Fallback to local storage
      const localScore = localStorage.getItem('balloonpop_highscore');
      return localScore ? parseInt(localScore, 10) : 0;
    }
  }

  async saveUserData(userData: Partial<UserData>): Promise<boolean> {
    if (!this.db || !this.currentUser || this.isGuest()) {
      // Store in local storage for guest users
      const existingData = localStorage.getItem('balloonpop_userdata');
      const existing = existingData ? JSON.parse(existingData) : {};
      const updated = { ...existing, ...userData };
      localStorage.setItem('balloonpop_userdata', JSON.stringify(updated));
      return true;
    }

    try {
      const userDocRef = doc(this.db, `artifacts/${this.appId}/users/${this.currentUser.uid}/gameData`, 'userData');
      await setDoc(userDocRef, {
        ...userData,
        userId: this.currentUser.uid,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Failed to save user data:', error);
      return false;
    }
  }

  async getUserData(): Promise<Partial<UserData>> {
    if (!this.db || !this.currentUser || this.isGuest()) {
      // Get from local storage for guest users
      const localData = localStorage.getItem('balloonpop_userdata');
      return localData ? JSON.parse(localData) : {};
    }

    try {
      const userDocRef = doc(this.db, `artifacts/${this.appId}/users/${this.currentUser.uid}/gameData`, 'userData');
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Partial<UserData>;
      }
      
      return {};
    } catch (error) {
      console.error('Failed to get user data:', error);
      return {};
    }
  }

  // Utility method to get Firebase config from environment or defaults
  static getConfig(): FirebaseConfig {
    // Check for global Firebase config (if injected from external source)
    if (typeof window !== 'undefined') {
      const globalConfig = (window as any).__firebase_config;
      if (globalConfig) {
        return JSON.parse(globalConfig);
      }
    }

    // Fallback to environment variables or defaults
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "default-app-id"
    };
  }

  // Get app ID from global variable or environment
  static getAppId(): string {
    if (typeof window !== 'undefined') {
      const globalAppId = (window as any).__app_id;
      if (globalAppId) {
        return globalAppId;
      }
    }
    
    return process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
  }

  // Get initial auth token if available
  static getInitialAuthToken(): string | undefined {
    if (typeof window !== 'undefined') {
      return (window as any).__initial_auth_token;
    }
    return undefined;
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

// Utility functions for easy access
export const initializeFirebase = async (): Promise<void> => {
  const config = FirebaseService.getConfig();
  const appId = FirebaseService.getAppId();
  const initialToken = FirebaseService.getInitialAuthToken();
  
  await firebaseService.initialize(config, appId, initialToken);
};

export const getCurrentUserId = (): string => firebaseService.getCurrentUserId();
export const saveHighScore = (score: number): Promise<boolean> => firebaseService.saveHighScore(score);
export const getHighScore = (): Promise<number> => firebaseService.getHighScore();
export const saveUserData = (data: Partial<UserData>): Promise<boolean> => firebaseService.saveUserData(data);
export const getUserData = (): Promise<Partial<UserData>> => firebaseService.getUserData();
export const isAuthenticated = (): boolean => firebaseService.isAuthenticated();
export const isGuest = (): boolean => firebaseService.isGuest();