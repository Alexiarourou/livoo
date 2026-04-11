import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

const busyByBtn = new WeakMap();

/** Firestore snapshot: this project’s runtime exposes exists as a method. */
function snapExists(snap) {
  return snap.exists();
}

/**
 * Sets .liked and count color for every .like-btn[data-post-id] for the current user.
 * Safe to call after new cards are injected (feed) or when auth becomes ready.
 */
export async function initLikedButtonsForCurrentUser() {
  const user = auth.currentUser;
  if (!user) return;

  const buttons = document.querySelectorAll(".like-btn[data-post-id]");
  await Promise.all(
    Array.from(buttons).map(async (btn) => {
      const postId = btn.dataset.postId;
      if (!postId) return;
      const likeRef = doc(db, "communityPosts", postId, "likes", user.uid);
      try {
        const snap = await getDoc(likeRef);
        const countEl = btn.querySelector(".like-count");
        if (snapExists(snap)) {
          btn.classList.add("liked");
          if (countEl) countEl.style.color = "#059669";
        } else {
          btn.classList.remove("liked");
          if (countEl) countEl.style.color = "";
        }
      } catch (e) {
        console.error("Init like state error:", e);
      }
    })
  );
}

if (typeof window !== "undefined") {
  window.initLikedButtonsForCurrentUser = initLikedButtonsForCurrentUser;
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    document.querySelectorAll(".like-btn[data-post-id].liked").forEach((btn) => {
      btn.classList.remove("liked");
      const countEl = btn.querySelector(".like-count");
      if (countEl) countEl.style.color = "";
    });
    return;
  }
  initLikedButtonsForCurrentUser();
});

if (auth.currentUser) {
  initLikedButtonsForCurrentUser();
}

document.body.addEventListener("click", async (e) => {
  const btn = e.target.closest(".like-btn[data-post-id]");
  if (!btn) return;

  console.log("=== LIKE CLICK ===");
  console.log("Post ID:", btn.dataset.postId);
  console.log("Current user:", auth.currentUser?.uid ?? "NOT LOGGED IN");
  console.log("Busy map has entry:", !!busyByBtn.get(btn));

  e.preventDefault();
  e.stopPropagation();

  const postId = btn.dataset.postId;
  const countEl = btn.querySelector(".like-count");
  if (!countEl) {
    console.log("No .like-count child — abort");
    return;
  }

  if (!auth.currentUser) {
    console.log("Redirecting to signup — no user");
    window.location.href = "signup.html";
    return;
  }

  if (busyByBtn.get(btn)) {
    console.log("Blocked — busy");
    return;
  }

  busyByBtn.set(btn, true);
  btn.disabled = true;

  const uid = auth.currentUser.uid;
  const likeRef = doc(db, "communityPosts", postId, "likes", uid);
  const postRef = doc(db, "communityPosts", postId);

  try {
    const snap = await getDoc(likeRef);
    console.log("Like doc exists:", snapExists(snap));
    if (snapExists(snap)) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { upvoteCount: increment(-1) });
      btn.classList.remove("liked");
      countEl.style.color = "";
      countEl.textContent = String(Math.max(0, (parseInt(countEl.textContent, 10) || 0) - 1));
    } else {
      await setDoc(likeRef, { likedAt: serverTimestamp() });
      await updateDoc(postRef, { upvoteCount: increment(1) });
      btn.classList.add("liked");
      countEl.style.color = "#059669";
      countEl.textContent = String((parseInt(countEl.textContent, 10) || 0) + 1);
    }
  } catch (err) {
    console.error("Like click error:", err);
  } finally {
    busyByBtn.delete(btn);
    btn.disabled = false;
  }
});
