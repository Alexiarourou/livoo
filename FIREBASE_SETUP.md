# Firebase Authentication Setup for Livvo

Livvo uses **Firebase Authentication** for real user accounts, login, and password reset emails. Follow these steps to enable it.

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** (or use an existing one)
3. Follow the setup wizard

## 2. Enable Email/Password authentication

1. In your Firebase project, go to **Authentication** → **Sign-in method**
2. Click **Email/Password**
3. Enable **Email/Password** and **Email link** (for password reset)
4. Save

## 3. Add your web app

1. In **Project settings** (gear icon), scroll to **Your apps**
2. Click the **Web** icon (`</>`)
3. Register your app with a nickname (e.g. "Livvo Web")
4. Copy the `firebaseConfig` object that appears

## 4. Configure `firebase-config.js`

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your Firebase config:

```javascript
const LIVVO_FIREBASE_CONFIG = {
  apiKey: "AIza...",           // Your API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

## 5. Authorize your domain

1. In Firebase → **Authentication** → **Settings** → **Authorized domains**
2. Add your deployed domain (e.g. `alexiarourou-livoo.vercel.app`)
3. `localhost` is already authorized for local testing

## What works once configured

- **Sign up** – Creates real accounts in Firebase
- **Log in** – Authenticates with email and password
- **Forgot password** – Sends an email with a reset link (from Firebase/noreply)
- **Log out** – Clears session
- **Persistent sessions** – Users stay logged in across page reloads

## Password reset email

When a user clicks **Forgot password?** and enters their email, Firebase sends an email with a link. The link goes to a Google-hosted page where they can set a new password. The link expires in 1 hour.

You can customize the email template in Firebase Console → **Authentication** → **Templates** → **Password reset**.

## Without Firebase (demo mode)

If `firebase-config.js` is not configured (still has placeholder values), the site falls back to **demo mode** using `localStorage`. Accounts are not persistent and "Forgot password" will show a setup message.
