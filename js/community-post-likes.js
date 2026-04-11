import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Post-level likes: communityPosts/{postId}/likes/{uid}, counter on post.upvoteCount.
 * One listener per button; processing + disabled block stacked clicks until Firestore finishes.
 */
export async function initPostLikeButton(db, auth, postId, btnEl, countEl, opts) {
  opts = opts || {};
  const signupUrl = opts.signupUrl || "signup.html";

  if (!btnEl || !countEl) {
    return function noop() {};
  }

  if (!auth.currentUser) {
    const handler = function () {
      window.location.href = signupUrl;
    };
    btnEl.addEventListener("click", handler);
    return function cleanup() {
      btnEl.removeEventListener("click", handler);
    };
  }

  const postRef = doc(db, "communityPosts", postId);

  const initialLike = await getDoc(
    doc(db, "communityPosts", postId, "likes", auth.currentUser.uid)
  );
  if (initialLike.exists) {
    btnEl.classList.add("liked");
  }

  const unsubPost = onSnapshot(postRef, (snap) => {
    if (snap.exists) {
      const n = snap.data().upvoteCount;
      countEl.textContent = n !== undefined && n !== null ? String(n) : "0";
    }
  });

  let processing = false;

  async function onLikeClick(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (!auth.currentUser) {
      window.location.href = signupUrl;
      return;
    }

    if (processing) return;
    processing = true;
    btnEl.disabled = true;

    const uid = auth.currentUser.uid;
    const likeRef = doc(db, "communityPosts", postId, "likes", uid);

    try {
      const snap = await getDoc(likeRef);
      if (snap.exists) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { upvoteCount: increment(-1) });
        btnEl.classList.remove("liked");
      } else {
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(postRef, { upvoteCount: increment(1) });
        btnEl.classList.add("liked");
      }
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      processing = false;
      btnEl.disabled = false;
    }
  }

  btnEl.addEventListener("click", onLikeClick);

  return function cleanup() {
    try {
      unsubPost();
    } catch (e) {}
    btnEl.removeEventListener("click", onLikeClick);
  };
}
