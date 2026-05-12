import { getApps, initializeApp } from "firebase/app";
import { browserSessionPersistence, getAuth, GoogleAuthProvider, OAuthProvider, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getClientApp() {
  if (typeof window === "undefined") {
    return null;
  }
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getClientAuth() {
  const app = getClientApp();
  return app ? getAuth(app) : null;
}

export async function configureSessionAuthPersistence(auth = getClientAuth()) {
  if (!auth) return null;
  await setPersistence(auth, browserSessionPersistence);
  return auth;
}

export function getClientDb() {
  const app = getClientApp();
  return app ? getFirestore(app) : null;
}

export function getClientStorage() {
  const app = getClientApp();
  return app ? getStorage(app) : null;
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function getMicrosoftProvider() {
  const provider = new OAuthProvider("microsoft.com");
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
