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

const busyPosts = new Set();
const busyComments = new Set();

const auth = getAuth(app);
const db = getFirestore(app);

/** Firestore snapshot: this project’s runtime exposes exists as a method. */
function snapExists(snap) {
  return snap.exists();
}

/**
 * Sets .liked on post like buttons only (count comes from page / hydratePost).
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
        if (snapExists(snap)) btn.classList.add("liked");
        else btn.classList.remove("liked");
      } catch (e) {
        console.error("Init like state error:", e);
      }
    })
  );
}

/**
 * Sets .liked on comment like buttons only (count comes from renderComments / server).
 */
export async function initCommentLikeButtonsForCurrentUser() {
  const user = auth.currentUser;
  if (!user) return;

  const buttons = document.querySelectorAll(".comment-like-btn[data-comment-id][data-post-id]");
  await Promise.all(
    Array.from(buttons).map(async (btn) => {
      const postId = btn.dataset.postId;
      const commentId = btn.dataset.commentId;
      if (!postId || !commentId) return;
      const likeRef = doc(db, "communityPosts", postId, "comments", commentId, "likes", user.uid);
      try {
        const snap = await getDoc(likeRef);
        if (snapExists(snap)) btn.classList.add("liked");
        else btn.classList.remove("liked");
      } catch (e) {
        console.error("Init comment like state error:", e);
      }
    })
  );
}

if (typeof window !== "undefined") {
  window.initLikedButtonsForCurrentUser = initLikedButtonsForCurrentUser;
  window.initCommentLikeButtonsForCurrentUser = initCommentLikeButtonsForCurrentUser;
}

function runLikeInits() {
  initLikedButtonsForCurrentUser();
  initCommentLikeButtonsForCurrentUser();
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    document.querySelectorAll(".like-btn[data-post-id].liked").forEach((btn) => {
      btn.classList.remove("liked");
    });
    document.querySelectorAll(".comment-like-btn[data-comment-id].liked").forEach((btn) => {
      btn.classList.remove("liked");
    });
    return;
  }
  runLikeInits();
});

if (auth.currentUser) {
  runLikeInits();
}

document.body.addEventListener('click', async (e) => {
  const cbtn = e.target.closest('.comment-like-btn[data-comment-id][data-post-id]');
  if (cbtn) {
    e.preventDefault();
    e.stopPropagation();

    const postId = cbtn.dataset.postId;
    const commentId = cbtn.dataset.commentId;

    if (!auth.currentUser) {
      window.location.href = 'signup.html';
      return;
    }

    if (busyComments.has(commentId)) return;

    busyComments.add(commentId);
    cbtn.disabled = true;

    const uid = auth.currentUser.uid;
    const commentRef = doc(db, 'communityPosts', postId, 'comments', commentId);
    const likeRef = doc(db, 'communityPosts', postId, 'comments', commentId, 'likes', uid);
    const countEl = cbtn.querySelector('.comment-like-count');

    try {
      const snap = await getDoc(likeRef);
      const commentSnap = await getDoc(commentRef);
      const cur = Math.max(0, Number((commentSnap.data() || {}).likes || (commentSnap.data() || {}).likeCount || 0));

      if (snap.exists()) {
        await deleteDoc(likeRef);
        if (cur > 0) await updateDoc(commentRef, { likes: increment(-1) });
        cbtn.classList.remove('liked');
      } else {
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(commentRef, { likes: increment(1) });
        cbtn.classList.add('liked');
      }
      const cs = await getDoc(commentRef);
      if (countEl) {
        countEl.textContent = String(Math.max(0, Number((cs.data() || {}).likes || (cs.data() || {}).likeCount || 0)));
      }
    } catch (err) {
      console.error('Comment like error:', err);
    } finally {
      busyComments.delete(commentId);
      cbtn.disabled = false;
    }
    return;
  }

  const btn = e.target.closest('.like-btn[data-post-id]');
  if (!btn) return;

  const postId = btn.dataset.postId;

  if (!auth.currentUser) {
    window.location.href = 'signup.html';
    return;
  }

  if (busyPosts.has(postId)) return;

  busyPosts.add(postId);
  btn.disabled = true;

  const uid = auth.currentUser.uid;
  const postRef = doc(db, 'communityPosts', postId);
  const likeRef = doc(db, 'communityPosts', postId, 'likes', uid);

  try {
    const snap = await getDoc(likeRef);
    if (snap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { upvoteCount: increment(-1) });
      btn.classList.remove('liked');
      const c = btn.querySelector('.like-count');
      if (c) c.textContent = Math.max(0, parseInt(c.textContent) - 1);
    } else {
      await setDoc(likeRef, { likedAt: serverTimestamp() });
      await updateDoc(postRef, { upvoteCount: increment(1) });
      btn.classList.add('liked');
      const c = btn.querySelector('.like-count');
      if (c) c.textContent = parseInt(c.textContent) + 1;
    }
  } catch(err) {
    console.error('Like error:', err);
  } finally {
    busyPosts.delete(postId);
    btn.disabled = false;
  }
});
