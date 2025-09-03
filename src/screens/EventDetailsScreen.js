import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { auth, db } from "../firebase";
import {
  isLocalReminderScheduled,
  scheduleLocalReminder,
} from "../services/notifications";

export default function EventDetailsScreen({ route }) {
  const { id } = route.params;
  const [event, setEvent] = useState(null);
  const [remind, setRemind] = useState(15);
  const [isInterested, setIsInterested] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const [reminderScheduled, setReminderScheduled] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "events", id)).then((snap) =>
      setEvent({ id: snap.id, ...snap.data() })
    );
    const uid = auth.currentUser?.uid;
    if (uid) {
      getDoc(doc(db, "users", uid)).then((snap) => {
        const interests = snap.data()?.interests || [];
        setIsInterested(interests.includes(id));
      });
    }
    // Check if reminder is scheduled for this event
    (async () => {
      if (eventDate && !isNaN(eventDate.getTime())) {
        try {
          const scheduled = await isLocalReminderScheduled(id);
          setReminderScheduled(!!scheduled);
        } catch (e) {
          setReminderScheduled(false);
        }
      } else {
        setReminderScheduled(false);
      }
    })();
  }, [id]);

  if (!event) return null;

  const eventDate = event.dateTime?.toDate
    ? event.dateTime.toDate()
    : new Date(event.dateTime);
  const isPast =
    eventDate && !isNaN(eventDate.getTime())
      ? eventDate.getTime() < Date.now()
      : false;

  async function addToInterests() {
    setInterestLoading(true);
    const uid = auth.currentUser.uid;
    await updateDoc(doc(db, "users", uid), { interests: arrayUnion(id) });
    setIsInterested(true);
    setInterestLoading(false);
  }
  async function removeFromInterests() {
    setInterestLoading(true);
    const uid = auth.currentUser.uid;
    await updateDoc(doc(db, "users", uid), { interests: arrayRemove(id) });
    setIsInterested(false);
    setReminderScheduled(false);
    setInterestLoading(false);
  }

  async function remindMe() {
    await scheduleLocalReminder(eventDate, remind, {
      title: event.name,
      body: `Starts in ${remind} min`,
      eventId: id,
    });
    setReminderScheduled(true);
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: 590 }}>Event Name</Text>
        <Text style={{ fontSize: 22 }}>{event.name}</Text>
      </View>
      <View style={{ height: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text>Event Description</Text>
        <Text style={{ flex: 1, textAlign: "right" }}>{event.description}</Text>
      </View>
      <View style={{ height: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text>Event time</Text>
        <Text>{eventDate?.toLocaleString?.() || "-"}</Text>
      </View>
      <View style={{ height: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text>Occurs Every</Text>
        <Text>
          {Array.isArray(event.occursEvery) && event.occursEvery.length
            ? event.occursEvery
                .map(
                  (idx) =>
                    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]
                )
                .join(", ")
            : "Once"}
        </Text>
      </View>
      <View style={{ height: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text>Event Organizer</Text>
        <Text>{event.organizerName}</Text>
      </View>
      <View style={{ height: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text>Group Name</Text>
        <Text>{event.groupName || "Public"}</Text>
      </View>
      <View style={{ height: 12 }} />

      {isPast && (
        <Text style={{ color: "#64748b", marginBottom: 12 }}>
          This event has passed.
        </Text>
      )}

      {!isPast && isInterested && !reminderScheduled && (
        <Button title={`Remind Before ${remind} min`} onPress={remindMe} />
      )}
      <View style={{ height: 12 }} />
      {!isPast &&
        (interestLoading ? (
          <View style={{ paddingVertical: 4 }}>
            <ActivityIndicator />
          </View>
        ) : isInterested ? (
          <Button title="Remove from interests" onPress={removeFromInterests} />
        ) : (
          <Button title="Interested?" onPress={addToInterests} />
        ))}
    </View>
  );
}
