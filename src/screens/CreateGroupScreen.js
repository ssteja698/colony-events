import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../firebase";

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

export default function CreateGroupScreen({ navigation, route }) {
  const edit = route?.params?.edit;
  const groupId = route?.params?.id;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingGroup, setLoadingGroup] = useState(!!edit);

  const filteredEvents = events.filter((event) => {
    const isPublic = !event.groupId || event.groupId === "public";
    const isCurrGroup = event.groupId === groupId;
    const date = event?.dateTime?.toDate
      ? event.dateTime.toDate()
      : new Date(event?.dateTime);
    const isPast =
      date && !isNaN(date.getTime()) ? date.getTime() < Date.now() : false;

    return (!isPast && isPublic) || isCurrGroup;
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "events")), (ss) => {
      setEvents(ss.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingEvents(false);
    });
    return () => unsub();
  }, []);

  // Load group data if editing
  useEffect(() => {
    async function loadGroup() {
      if (edit && groupId) {
        setLoadingGroup(true);
        const docSnap = await getDocs(
          query(collection(db, "groups"), where("__name__", "==", groupId))
        );
        let groupData = null;
        if (!docSnap.empty) {
          const d = docSnap.docs[0];
          groupData = { id: d.id, ...d.data() };
        }
        if (groupData) {
          setName(groupData.name || "");
          setDescription(groupData.description || "");
          setSelectedEventIds(groupData.eventIds || []);
        }
        setLoadingGroup(false);
      }
    }
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit, groupId]);

  function toggleEvent(id) {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit() {
    if (loadingEvents || loadingGroup) return; // still loading
    if (!name.trim()) {
      showAlert("Missing name", "Please enter a group name.");
      return;
    }
    if (name.trim().toLowerCase() === "public") {
      showAlert(
        "Reserved name",
        "The name 'public' is reserved and cannot be used for groups."
      );
      return;
    }
    if (!filteredEvents.length) {
      showAlert(
        "No events available",
        "Create an event before creating/updating a group."
      );
      return;
    }
    if (!selectedEventIds.length) {
      showAlert(
        "Select events",
        "Please attach at least one event to the group."
      );
      return;
    }
    setSubmitting(true);

    if (edit && groupId) {
      // Update existing group
      await updateDoc(doc(db, "groups", groupId), {
        description,
        eventIds: selectedEventIds,
      });

      // Get current group data to find unselected events
      const groupDoc = await getDocs(
        query(collection(db, "events"), where("groupId", "==", groupId))
      );
      const currentGroupEvents = groupDoc.docs.map((d) => d.id);

      // Find events that were unselected
      const unselectedEvents = currentGroupEvents.filter(
        (eid) => !selectedEventIds.includes(eid)
      );

      const batch = writeBatch(db);

      // Update newly selected events
      selectedEventIds.forEach((eid) => {
        batch.update(doc(db, "events", eid), {
          groupId: groupId,
          groupName: name.trim(),
        });
      });

      // Update unselected events to be public
      unselectedEvents.forEach((eid) => {
        batch.update(doc(db, "events", eid), {
          groupId: "public",
          groupName: null,
        });
      });

      await batch.commit();
    } else {
      // Create new group
      // Uniqueness: group name must be unique
      const dupQ = query(
        collection(db, "groups"),
        where("name", "==", name.trim())
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        showAlert("Duplicate name", "A group with this name already exists.");
        setSubmitting(false);
        return;
      }
      const groupRef = await addDoc(collection(db, "groups"), {
        name: name.trim(),
        description,
        members: [auth.currentUser.uid],
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        isPrivate: false,
        eventIds: selectedEventIds,
      });

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        groups: arrayUnion(groupRef.id),
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
    }

    setSubmitting(false);
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Group Name"
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 8,
          backgroundColor: edit ? "#e5e7eb" : "#fff",
        }}
        value={name}
        onChangeText={setName}
        editable={!edit}
      />
      <TextInput
        placeholder="Description"
        style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={{ marginBottom: 8 }}>Attach Events</Text>
      {loadingEvents || loadingGroup ? (
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
                backgroundColor: selectedEventIds.includes(item.id)
                  ? "#2563eb"
                  : "#fff",
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  color: selectedEventIds.includes(item.id) ? "#fff" : "#000",
                }}
              >
                {item.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  opacity: 0.7,
                  color: selectedEventIds.includes(item.id) ? "#fff" : "#000",
                }}
              >
                {item.description}
              </Text>
            </Pressable>
          )}
        />
      )}

      {submitting ? (
        <ActivityIndicator />
      ) : (
        <Button
          title={edit ? "Update" : "Submit"}
          onPress={submit}
          disabled={loadingEvents || loadingGroup}
        />
      )}
    </View>
  );
}
