import React, { useEffect, useState } from "react";
import { View, TextInput, Button, Text, Pressable, FlatList, Alert, ActivityIndicator, Platform } from "react-native";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp, onSnapshot, query, doc, writeBatch, getDocs, where } from "firebase/firestore";

function showAlert(title, message) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window?.alert) {
      window.alert(`${title}\n${message}`);
      return;
    }
  }
  try {
    Alert.alert(title, message);
  } catch (e) {
    // no-op
  }
}

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const filteredEvents = events.filter((event) => {
    const date = event?.dateTime?.toDate ? event.dateTime.toDate() : new Date(event?.dateTime);
    const isPast = date && !isNaN(date.getTime()) ? date.getTime() < Date.now() : false;

    return !isPast;
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "events")), (ss) => {
      setEvents(ss.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingEvents(false);
    });
    return () => unsub();
  }, []);

  function toggleEvent(id) {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit() {
    if (loadingEvents) return; // still loading
    if (!name.trim()) {
      showAlert("Missing name", "Please enter a group name.");
      return;
    }
    // Uniqueness: group name must be unique
    const dupQ = query(collection(db, "groups"), where("name", "==", name.trim()));
    const dupSnap = await getDocs(dupQ);
    if (!dupSnap.empty) {
      showAlert("Duplicate name", "A group with this name already exists.");
      return;
    }
    if (!filteredEvents.length) {
      showAlert("No events available", "Create an event before creating a group.");
      return;
    }
    if (!selectedEventIds.length) {
      showAlert("Select events", "Please attach at least one event to the group.");
      return;
    }
    setSubmitting(true);

    const groupRef = await addDoc(collection(db, "groups"), {
      name: name.trim(),
      description,
      members: [auth.currentUser.uid],
      createdAt: serverTimestamp(),
      isPrivate: false,
      eventIds: selectedEventIds,
    });

    if (selectedEventIds.length) {
      const batch = writeBatch(db);
      selectedEventIds.forEach((eid) => {
        batch.update(doc(db, "events", eid), {
          groupId: groupRef.id,
          groupName: name.trim(),
        });
      });
      await batch.commit();
    }

    setSubmitting(false);
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Group Name"
        style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Description"
        style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={{ marginBottom: 8 }}>Attach Events</Text>
      {loadingEvents ? (
        <ActivityIndicator style={{ marginBottom: 8 }} />
      ) : !filteredEvents.length ? (
        <Text style={{ marginBottom: 8, color: "#b91c1c" }}>
          No upcoming events found. Please create an event first.
        </Text>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(i) => i.id}
          style={{ maxHeight: 220, marginBottom: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => toggleEvent(item.id)}
              style={{
                borderWidth: 1,
                borderRadius: 8,
                padding: 10,
                marginBottom: 6,
                backgroundColor: selectedEventIds.includes(item.id) ? "#e5e7eb" : "#fff",
              }}
            >
              <Text style={{ fontWeight: "600" }}>{item.name}</Text>
              <Text numberOfLines={1} style={{ opacity: 0.7 }}>
                {item.description}
              </Text>
            </Pressable>
          )}
        />
      )}

      {submitting ? (
        <ActivityIndicator />
      ) : (
        <Button title="Submit" onPress={submit} disabled={loadingEvents} />
      )}
    </View>
  );
}
