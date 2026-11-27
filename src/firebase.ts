import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { State } from './lib'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)

const app = firebaseReady ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null
const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null

export function observeAuth(callback: (user: User | null) => void) {
  if (!auth) return () => undefined
  return onAuthStateChanged(auth, callback)
}

export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase 설정이 아직 없어요. 환경변수를 먼저 넣어 주세요.')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  await signInWithPopup(auth, provider)
}

export async function logoutGoogle() {
  if (auth) await signOut(auth)
}

export async function loadRemoteState(uid: string): Promise<State | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'users', uid, 'state', 'main'))
  return snap.exists() ? snap.data().state as State : null
}

export async function saveRemoteState(uid: string, state: State) {
  if (!db) return
  await setDoc(doc(db, 'users', uid, 'state', 'main'), {
    state,
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}

export function isAllowedCompanyEmail(email: string | null) {
  const domain = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN as string | undefined)?.trim().toLowerCase() || 'shiftone.kr'
  if (!domain) return true
  return Boolean(email?.toLowerCase().endsWith(`@${domain}`))
}
