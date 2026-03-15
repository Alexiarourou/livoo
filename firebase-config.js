/**
 * Livvo Firebase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Authentication → Get started → enable "Email/Password" sign-in
 * 4. Firestore Database → Create database → Start in production → Add rules (see below)
 * 5. Project settings (gear) → Your apps → Add Web app → Copy firebaseConfig below
 * 6. Authentication → Settings → Authorized domains → Add livvo.net and your deploy URLs
 *
 * Firestore rules (Database → Rules):
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /community_posts/{postId} {
 *       allow read: if true;
 *       allow create: if request.auth != null;
 *       allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
 *     }
 *     match /community_comments/{commentId} {
 *       allow read: if true;
 *       allow create: if request.auth != null;
 *     }
 *   }
 * }
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
