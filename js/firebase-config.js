import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfKo7gumTCJ1FtqnrV-uGAgoIvhZPowTI",
  authDomain: "livvo-573e1.firebaseapp.com",
  projectId: "livvo-573e1",
  storageBucket: "livvo-573e1.firebasestorage.app",
  messagingSenderId: "438563892670",
  appId: "1:438563892670:web:c038316d9d3fcbee065def"
};

export const app = initializeApp(firebaseConfig);

/**
 * Long-polling avoids Safari/WebKit blocking the Firestore streaming Listen channel
 * ("Fetch API cannot load ... due to access control checks"). Must use this db everywhere.
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
