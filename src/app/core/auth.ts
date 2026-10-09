import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth as FirebaseAuth, User, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { BeautyRole } from './beauty.model';

@Service()
export class Auth {
  private readonly router = inject(Router);
  private readonly app: FirebaseApp = getApps().length ? getApp() : initializeApp(environment.firebase);
  private readonly firebaseAuth: FirebaseAuth = getAuth(this.app);
  private readonly currentUserState = signal<User | null>(null);
  private readonly roleState = signal<BeautyRole>('owner');

  readonly currentUser = this.currentUserState.asReadonly();
  readonly role = this.roleState.asReadonly();
  readonly demoMode = signal(true);
  readonly authenticated = computed(() => this.currentUserState() !== null || this.demoMode());

  constructor() {
    onAuthStateChanged(this.firebaseAuth, (user) => this.currentUserState.set(user));
  }

  async login(email: string, password: string): Promise<void> {
    this.demoMode.set(false);
    await signInWithEmailAndPassword(this.firebaseAuth, email, password);
    await this.router.navigateByUrl('/dashboard');
  }

  enterDemo(role: BeautyRole = 'owner'): void {
    this.roleState.set(role);
    this.demoMode.set(true);
    void this.router.navigateByUrl('/dashboard');
  }

  async token(forceRefresh = false): Promise<string | null> {
    return this.firebaseAuth.currentUser?.getIdToken(forceRefresh) ?? null;
  }

  async logout(): Promise<void> {
    if (this.firebaseAuth.currentUser) await signOut(this.firebaseAuth);
    this.demoMode.set(false);
    await this.router.navigateByUrl('/login');
  }
}
