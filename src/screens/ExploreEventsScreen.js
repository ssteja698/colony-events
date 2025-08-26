import React, { useEffect, useState } from "react";
import { View, FlatList, Pressable, Text, ActivityIndicator } from "react-native";
import { collection, onSnapshot, query, doc, onSnapshot as onDocSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import EventCard from "../ui/EventCard";

function Segmented({ leftSelected, onLeft, onRight, leftLabel, rightLabel }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 12 }}>
      <Pressable
        onPress={onLeft}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderWidth: 1,
          borderRadius: 8,
          marginRight: 6,
          backgroundColor: leftSelected ? "#e5e7eb" : "#fff",
          alignItems: "center",
        }}
      >
        <Text>{leftLabel}</Text>
      </Pressable>
      <Pressable
        onPress={onRight}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderWidth: 1,
          borderRadius: 8,
          marginLeft: 6,
          backgroundColor: !leftSelected ? "#e5e7eb" : "#fff",
          alignItems: "center",
        }}
      >
        <Text>{rightLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function ExploreEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    let unsubUser = () => {};
    if (uid) {
      const userRef = doc(db, "users", uid);
      unsubUser = onDocSnapshot(userRef, (snap) => {
        setJoinedGroupIds(snap.data()?.groups || []);
      });
    }

    const unsubEvents = onSnapshot(
      query(collection(db, "events")),
      (ss) => {
        const all = ss.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(all);
        setLoading(false);
      },
      () => {
        setError("No events found");
        setLoading(false);
      } 
    );

    return () => {
      unsubUser();
      unsubEvents();
    };
  }, []);

  const visible = events.filter((e) => {
    if (!e.groupId || e.groupId === "public") return true;
    return joinedGroupIds.includes(e.groupId);
  });

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Segmented
        leftSelected
        leftLabel="Events"
        rightLabel="Groups"
        onLeft={() => {}}
        onRight={() => navigation.replace("Groups")}
      />
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={{ color: "black", opacity: 0.6 }}>{error}</Text>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={() => (
            <Text style={{ opacity: 0.6 }}>No events found.</Text>
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
