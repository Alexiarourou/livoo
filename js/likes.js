import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { app, db } from "./firebase-config.js";

/* Busy guards: must stay at module scope so they persist across auth callbacks and clicks. */
const busyPosts = new Set();
const busyComments = new Set();
const busyReplies = new Set();

const auth = getAuth(app);

/** Prefer toast when unauthenticated; likes run before redirect timers on some pages. */
function requireAuthForLike(kind) {
  const user = auth.currentUser;
  if (user) return user;
  const msg =
    kind === "post"
      ? "Sign in to like posts"
      : kind === "comment"
        ? "Sign in to like comments"
        : "Sign in to like replies";
  if (typeof window !== "undefined" && typeof window.showToast === "function") {
    window.showToast(msg);
  } else {
    window.location.href = "signup.html";
  }
  return null;
}

/**
 * Firestore Web modular snapshots expose `exists` as a boolean property (see community-post
 * `if (!snap.exists)`). Calling `snap.exists()` throws and breaks every like toggle.
 */
function docSnapExists(snap) {
  if (!snap) return false;
  if (typeof snap.exists === "boolean") return snap.exists;
  if (typeof snap.exists === "function") return snap.exists();
  return false;
}

/** Init reads are best-effort; deployed rules may differ or Listen may fail before auth attaches. */
function logInitLikeError(e, label) {
  if (e && e.code === "permission-denied") return;
  console.error(label, e);
}

function replyBusyKey(postId, commentId, replyId) {
  return postId + "\0" + commentId + "\0" + replyId;
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
        if (docSnapExists(snap)) btn.classList.add("liked");
        else btn.classList.remove("liked");
      } catch (e) {
        logInitLikeError(e, "Init like state error:");
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
        if (docSnapExists(snap)) btn.classList.add("liked");
        else btn.classList.remove("liked");
      } catch (e) {
        logInitLikeError(e, "Init comment like state error:");
      }
    })
  );
}

/**
 * Sets .liked on nested reply like buttons only.
 */
export async function initReplyLikeButtonsForCurrentUser() {
  const user = auth.currentUser;
  if (!user) return;

  const buttons = document.querySelectorAll(".reply-like-btn[data-reply-id][data-comment-id][data-post-id]");
  await Promise.all(
    Array.from(buttons).map(async (btn) => {
      const postId = btn.dataset.postId;
      const commentId = btn.dataset.commentId;
      const replyId = btn.dataset.replyId;
      if (!postId || !commentId || !replyId) return;
      const likeRef = doc(
        db,
        "communityPosts",
        postId,
        "comments",
        commentId,
        "replies",
        replyId,
        "likes",
        user.uid
      );
      try {
        const snap = await getDoc(likeRef);
        if (docSnapExists(snap)) btn.classList.add("liked");
        else btn.classList.remove("liked");
      } catch (e) {
        logInitLikeError(e, "Init reply like state error:");
      }
    })
  );
}

if (typeof window !== "undefined") {
  window.initLikedButtonsForCurrentUser = initLikedButtonsForCurrentUser;
  window.initCommentLikeButtonsForCurrentUser = initCommentLikeButtonsForCurrentUser;
  window.initReplyLikeButtonsForCurrentUser = initReplyLikeButtonsForCurrentUser;
}

function runLikeInits() {
  initLikedButtonsForCurrentUser();
  initCommentLikeButtonsForCurrentUser();
  initReplyLikeButtonsForCurrentUser();
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    document.querySelectorAll(".like-btn[data-post-id].liked").forEach((btn) => {
      btn.classList.remove("liked");
    });
    document.querySelectorAll(".comment-like-btn[data-comment-id].liked").forEach((btn) => {
      btn.classList.remove("liked");
    });
    document.querySelectorAll(".reply-like-btn[data-reply-id].liked").forEach((btn) => {
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
  const rbtn = e.target.closest('.reply-like-btn[data-reply-id][data-comment-id][data-post-id]');
  if (rbtn) {
    e.preventDefault();
    e.stopPropagation();

    const postId = rbtn.dataset.postId;
    const commentId = rbtn.dataset.commentId;
    const replyId = rbtn.dataset.replyId;
    const bKey = replyBusyKey(postId, commentId, replyId);

    const userReply = requireAuthForLike("reply");
    if (!userReply) return;

    if (busyReplies.has(bKey)) return;

    busyReplies.add(bKey);
    rbtn.disabled = true;

    const uid = userReply.uid;
    const replyRef = doc(db, 'communityPosts', postId, 'comments', commentId, 'replies', replyId);
    const likeRef = doc(db, 'communityPosts', postId, 'comments', commentId, 'replies', replyId, 'likes', uid);
    const countEl = rbtn.querySelector('.reply-like-count');
    const prevShown = countEl ? parseInt(countEl.textContent, 10) || 0 : 0;
    const prevLiked = rbtn.classList.contains('liked');

    try {
      const snap = await getDoc(likeRef);
      const replySnap = await getDoc(replyRef);
      const cur = Math.max(0, Number((replySnap.data() || {}).likes || (replySnap.data() || {}).likeCount || 0));

      if (docSnapExists(snap)) {
        rbtn.classList.remove('liked');
        if (countEl) countEl.textContent = String(Math.max(0, prevShown - 1));
        await deleteDoc(likeRef);
        if (cur > 0) await updateDoc(replyRef, { likes: increment(-1) });
      } else {
        rbtn.classList.add('liked');
        if (countEl) countEl.textContent = String(prevShown + 1);
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(replyRef, { likes: increment(1) });
      }
    } catch (err) {
      console.error('Reply like error:', err);
      if (prevLiked) rbtn.classList.add('liked');
      else rbtn.classList.remove('liked');
      if (countEl) countEl.textContent = String(prevShown);
    } finally {
      busyReplies.delete(bKey);
      rbtn.disabled = false;
    }
    return;
  }

  const cbtn = e.target.closest('.comment-like-btn[data-comment-id][data-post-id]');
  if (cbtn) {
    e.preventDefault();
    e.stopPropagation();

    const postId = cbtn.dataset.postId;
    const commentId = cbtn.dataset.commentId;

    const userComment = requireAuthForLike("comment");
    if (!userComment) return;

    if (busyComments.has(commentId)) return;

    busyComments.add(commentId);
    cbtn.disabled = true;

    const uid = userComment.uid;
    const commentRef = doc(db, 'communityPosts', postId, 'comments', commentId);
    const likeRef = doc(db, 'communityPosts', postId, 'comments', commentId, 'likes', uid);
    const countEl = cbtn.querySelector('.comment-like-count');
    const prevShownC = countEl ? parseInt(countEl.textContent, 10) || 0 : 0;
    const prevLikedC = cbtn.classList.contains('liked');

    try {
      const snap = await getDoc(likeRef);
      const commentSnap = await getDoc(commentRef);
      const cur = Math.max(0, Number((commentSnap.data() || {}).likes || (commentSnap.data() || {}).likeCount || 0));

      if (docSnapExists(snap)) {
        cbtn.classList.remove('liked');
        if (countEl) countEl.textContent = String(Math.max(0, prevShownC - 1));
        await deleteDoc(likeRef);
        if (cur > 0) await updateDoc(commentRef, { likes: increment(-1) });
      } else {
        cbtn.classList.add('liked');
        if (countEl) countEl.textContent = String(prevShownC + 1);
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(commentRef, { likes: increment(1) });
      }
    } catch (err) {
      console.error('Comment like error:', err);
      if (prevLikedC) cbtn.classList.add('liked');
      else cbtn.classList.remove('liked');
      if (countEl) countEl.textContent = String(prevShownC);
    } finally {
      busyComments.delete(commentId);
      cbtn.disabled = false;
    }
    return;
  }

  const btn = e.target.closest('.like-btn[data-post-id]');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const postId = btn.dataset.postId;

  const userPost = requireAuthForLike("post");
  if (!userPost) return;

  if (busyPosts.has(postId)) return;

  busyPosts.add(postId);
  btn.disabled = true;

  const uid = userPost.uid;
  const postRef = doc(db, 'communityPosts', postId);
  const likeRef = doc(db, 'communityPosts', postId, 'likes', uid);
  const countSpan = btn.querySelector('.like-count');
  const prevPostCount = countSpan ? parseInt(countSpan.textContent, 10) || 0 : 0;
  const prevPostLiked = btn.classList.contains('liked');

  try {
    const snap = await getDoc(likeRef);
    if (docSnapExists(snap)) {
      btn.classList.remove('liked');
      if (countSpan) countSpan.textContent = String(Math.max(0, prevPostCount - 1));
      await deleteDoc(likeRef);
      await updateDoc(postRef, { upvoteCount: increment(-1) });
    } else {
      btn.classList.add('liked');
      if (countSpan) countSpan.textContent = String(prevPostCount + 1);
      await setDoc(likeRef, { likedAt: serverTimestamp() });
      await updateDoc(postRef, { upvoteCount: increment(1) });
    }
  } catch(err) {
    console.error('Like error:', err);
    if (prevPostLiked) btn.classList.add('liked');
    else btn.classList.remove('liked');
    if (countSpan) countSpan.textContent = String(prevPostCount);
  } finally {
    busyPosts.delete(postId);
    btn.disabled = false;
  }
});
