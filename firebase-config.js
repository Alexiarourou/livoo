/**
 * Livvo Firebase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Click "Authentication" → "Get started" → enable "Email/Password" sign-in
 * 4. In Project settings (gear icon), under "Your apps", add a Web app
 * 5. Copy the firebaseConfig object and paste it below, replacing the placeholder
 * 6. In Authentication → Settings → Authorized domains, add your deployed domain (e.g. yoursite.vercel.app)
 */

const LIVVO_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if Firebase is properly configured (user has replaced placeholders)
function isFirebaseConfigured() {
  return LIVVO_FIREBASE_CONFIG.apiKey && 
         LIVVO_FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" &&
         LIVVO_FIREBASE_CONFIG.projectId &&
         LIVVO_FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID";
}
