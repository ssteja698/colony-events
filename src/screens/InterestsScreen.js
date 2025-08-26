import React, { useEffect, useState } from "react";
import { View, FlatList, Button, Pressable, Text, ActivityIndicator } from "react-native";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import EventCard from "../ui/EventCard";

export default function InterestsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("Interests");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const uid = auth.currentUser.uid;
    const userRef = doc(db, "users", uid);
    const unsubUser = onSnapshot(
      userRef,
      (snap) => {
        const interests = snap.data()?.interests || [];
        if (!interests.length) {
          setEvents([]);
          setLoading(false);
          return;
        }
        const q = query(
          collection(db, "events"),
          where("__name__", "in", interests.slice(0, 10))
        );
        const unsubEvents = onSnapshot(
          q,
          (ss) => {
            setEvents(ss.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );
        return () => unsubEvents();
      },
      () => {
        // if user doc doesn't exist yet, stop loading gracefully
        setEvents([]);
        setLoading(false);
      }
    );
    return () => unsubUser();
  }, []);

  function SegmentedButton({ label, selected, onPress }) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderWidth: 1,
          borderRadius: 8,
          marginHorizontal: 6,
          backgroundColor: selected ? "#e5e7eb" : "#fff",
          alignItems: "center",
        }}
      >
        <Text>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <SegmentedButton
          label="Interests"
          selected={tab === "Interests"}
          onPress={() => setTab("Interests")}
        />
        <SegmentedButton
          label="Create"
          selected={tab === "Create"}
          onPress={() => setTab("Create")}
        />
      </View>

      {tab === "Create" ? (
        <View>
          <Button
            title="Create Event"
            onPress={() => navigation.navigate("CreateEvent")}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Create Group"
            onPress={() => navigation.navigate("CreateGroup")}
          />
        </View>
      ) : loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={{ color: "#b91c1c" }}>{error}</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Text style={{ opacity: 0.6 }}>No interested events yet.</Text>
          )}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate("EventDetails", { id: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}
