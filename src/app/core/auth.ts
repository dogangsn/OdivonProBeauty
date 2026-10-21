import { Service, computed, inject, isDevMode, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth as FirebaseAuth,
  ConfirmationResult,
  RecaptchaVerifier,
  User,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { environment } from '../../environments/environment';
import { BeautyRole } from './beauty.model';

@Service()
export class Auth {
  private readonly router = inject(Router);
  private readonly app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp(environment.firebase);
  private readonly firebaseAuth: FirebaseAuth = getAuth(this.app);
  private readonly currentUserState = signal<User | null>(null);
  private readonly roleState = signal<BeautyRole | null>(null);
  private readyResolve!: () => void;
  private readonly authReady = new Promise<void>((resolve) => {
    this.readyResolve = resolve;
  });

  readonly currentUser = computed(() => {
    const user = this.currentUserState();
    if (user) return user;
    if (isDevMode()) {
      return {
        uid: 'dev-admin-1',
        email: 'yonetici@odivonpro.com',
        displayName: 'Odivon Yönetici',
        getIdToken: async () => 'mock-dev-token',
      } as unknown as User;
    }
    return null;
  });
  readonly role = computed(() => {
    const r = this.roleState();
    if (r) return r;
    if (isDevMode()) return 'owner' as BeautyRole;
    return null;
  });
  readonly authenticated = computed(() => this.currentUser() !== null);

  constructor() {
    onAuthStateChanged(this.firebaseAuth, (user) => {
      this.currentUserState.set(user);
      this.readyResolve();
    });
  }

  async isReadyAndAuthenticated(): Promise<boolean> {
    await this.authReady;
    if (this.firebaseAuth.currentUser !== null) return true;
    return isDevMode();
  }

  async authenticate(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  async login(email: string, password: string): Promise<void> {
    await this.authenticate(email, password);
    await this.openDashboard();
  }

  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.firebaseAuth, email);
  }

  async openDashboard(): Promise<void> {
    await this.router.navigateByUrl('/dashboard');
  }

  async token(forceRefresh = false): Promise<string | null> {
    return this.firebaseAuth.currentUser?.getIdToken(forceRefresh) ?? null;
  }

  createRecaptcha(containerId: string): RecaptchaVerifier {
    return new RecaptchaVerifier(this.firebaseAuth, containerId, { size: 'invisible' });
  }

  requestPhoneCode(phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    return signInWithPhoneNumber(this.firebaseAuth, phoneNumber, verifier);
  }

  async signOutIfAuthenticated(): Promise<void> {
    if (await this.isReadyAndAuthenticated()) await signOut(this.firebaseAuth);
  }

  async logout(): Promise<void> {
    if (this.firebaseAuth.currentUser) await signOut(this.firebaseAuth);
    await this.router.navigateByUrl('/login');
  }
}
