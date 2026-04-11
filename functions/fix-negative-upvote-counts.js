/**
 * One-off: set upvoteCount to 0 on communityPosts where upvoteCount < 0.
 * Run from repo: cd functions && node fix-negative-upvote-counts.js
 * Requires Application Default Credentials (gcloud auth application-default login)
 * or GOOGLE_APPLICATION_CREDENTIALS to a service account with Firestore write access.
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  const snap = await db.collection("communityPosts").where("upvoteCount", "<", 0).get();
  if (snap.empty) {
    console.log("No posts with negative upvoteCount.");
    return;
  }
  let batch = db.batch();
  let ops = 0;
  let total = 0;
  for (const doc of snap.docs) {
    batch.update(doc.ref, { upvoteCount: 0 });
    ops++;
    total++;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  console.log("Updated", total, "post(s): upvoteCount set to 0.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
