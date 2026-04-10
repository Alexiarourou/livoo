const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Every Monday 08:00 UTC — top3 posts per city (last 7 days by upvoteCount),
 * email subscribers via Firestore Trigger Email extension (mail collection).
 */
exports.weeklyCommunityDigest = functions.pubsub
  .schedule('0 8 * * 1')
  .timeZone('UTC')
  .onRun(async () => {
    const db = admin.firestore();
    const weekAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let snap;
    try {
      snap = await db.collection('communityPosts').where('createdAt', '>=', weekAgo).get();
    } catch (e) {
      console.error('weeklyDigest query failed', e);
      return null;
    }

    const byCity = {};
    snap.forEach((doc) => {
      const d = doc.data() || {};
      const city = String(d.city || '').trim();
      if (!city) return;
      if (!byCity[city]) byCity[city] = [];
      byCity[city].push({
        id: doc.id,
        title: String(d.title || 'Post').trim() || 'Post',
        upvoteCount: Number(d.upvoteCount || 0),
      });
    });

    for (const city of Object.keys(byCity)) {
      const posts = byCity[city]
        .sort((a, b) => b.upvoteCount - a.upvoteCount)
        .slice(0, 3);
      if (!posts.length) continue;

      let usersSnap;
      try {
        usersSnap = await db.collection('users').where('city', '==', city).get();
      } catch (e) {
        console.error('weeklyDigest users', city, e);
        continue;
      }

      const itemsHtml = posts
        .map((p) => {
          const href =
            'https://livvo.net/community-post?postId=' +
            encodeURIComponent(p.id) +
            '&city=' +
            encodeURIComponent(city);
          return `<p style="margin:0 0 10px 0;font-family:system-ui,sans-serif;font-size:15px;"><a href="${href}" style="color:#059669;">${escapeHtml(p.title)}</a></p>`;
        })
        .join('');

      const html =
        `<div style="font-family:system-ui,sans-serif;color:#064e3b;max-width:480px;">` +
        `<p style="margin:0 0 16px 0;font-weight:700;">Top posts in ${escapeHtml(city)} this week</p>` +
        itemsHtml +
        `</div>`;

      for (const udoc of usersSnap.docs) {
        const email = String((udoc.data() || {}).email || '').trim();
        if (!email) continue;
        try {
          await db.collection('mail').add({
            to: [email],
            message: {
              subject: 'Top posts in ' + city + ' this week',
              html,
            },
          });
        } catch (e) {
          console.error('weeklyDigest mail skip', email, e);
        }
      }
    }
    return null;
  });
