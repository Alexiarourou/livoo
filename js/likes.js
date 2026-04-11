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

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  document.querySelectorAll(".like-btn[data-post-id]").forEach(async (btn) => {
    const postId = btn.dataset.postId;
    const likeRef = doc(db, "communityPosts", postId, "likes", user.uid);

    try {
      const snap = await getDoc(likeRef);
      if (snap.exists) btn.classList.add("liked");
      else btn.classList.remove("liked");
    } catch (e) {
      console.error("Init like state error:", e);
    }
  });
});

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
    console.log("Like doc exists:", snap.exists);
    if (snap.exists) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { upvoteCount: increment(-1) });
      btn.classList.remove("liked");
      countEl.textContent = String(Math.max(0, (parseInt(countEl.textContent, 10) || 0) - 1));
    } else {
      await setDoc(likeRef, { likedAt: serverTimestamp() });
      await updateDoc(postRef, { upvoteCount: increment(1) });
      btn.classList.add("liked");
      countEl.textContent = String((parseInt(countEl.textContent, 10) || 0) + 1);
    }
  } catch (err) {
    console.error("Like click error:", err);
  } finally {
    busyByBtn.delete(btn);
    btn.disabled = false;
  }
});
