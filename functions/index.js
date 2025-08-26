const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
admin.initializeApp();
const db = admin.firestore();

// Send push on event create to all group members (or everyone following public)
exports.onEventCreate = functions.firestore
  .document("events/{eventId}")
  .onCreate(async (snap, ctx) => {
    const event = snap.data();
    // fetch expo tokens of all users (demo; in production, target group members/interested users)
    const tokensSnap = await db.collection("pushTokens").get();
    const messages = tokensSnap.docs.map((d) => ({
      to: d.data().token,
      sound: "default",
      title: event.name,
      body: event.description?.slice(0, 80) || "New event",
      data: { id: ctx.params.eventId },
    }));
    // send via Expo push service
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  });

// (Optional) CRON to remind 15 minutes before events starting soon (server-side)
exports.remindUpcoming = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const in20 = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 20 * 60 * 1000
    );
    const ss = await db
      .collection("events")
      .where("dateTime", ">=", now)
      .where("dateTime", "<=", in20)
      .get();
    if (ss.empty) return null;
    const tokensSnap = await db.collection("pushTokens").get();
    const tokens = tokensSnap.docs.map((d) => d.data().token);
    const messages = [];
    ss.forEach((docu) => {
      const e = docu.data();
      messages.push(
        ...tokens.map((t) => ({
          to: t,
          sound: "default",
          title: `${e.name} in 15 min`,
          body: e.description?.slice(0, 80) || "",
          data: { id: docu.id },
        }))
      );
    });
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
    return null;
  });
