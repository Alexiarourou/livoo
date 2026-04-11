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
  const btn = e.target.closest(".like-btn");
  if (!btn || !btn.dataset.postId) return;
  e.preventDefault();
  e.stopPropagation();
  const postId = btn.dataset.postId;
  const countEl = btn.querySelector(".like-count");
  if (!countEl) return;

  const user = auth.currentUser;
  if (!user) {
    window.location.href = "signup.html";
    return;
  }
  if (busyByBtn.get(btn)) return;
  busyByBtn.set(btn, true);
  btn.disabled = true;

  const likeRef = doc(db, "communityPosts", postId, "likes", user.uid);
  const postRef = doc(db, "communityPosts", postId);

  try {
    const snap = await getDoc(likeRef);
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
    console.error(err);
  } finally {
    busyByBtn.delete(btn);
    btn.disabled = false;
  }
});
