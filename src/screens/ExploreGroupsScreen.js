import React, { useEffect, useState } from "react";
import { View, FlatList, Pressable, Text, ActivityIndicator } from "react-native";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import GroupCard from "../ui/GroupCard";

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

export default function ExploreGroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "groups")),
      (ss) => {
        setGroups(ss.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        setError("No groups found");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);
  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Segmented
        leftSelected={false}
        leftLabel="Events"
        rightLabel="Groups"
        onLeft={() => navigation.replace("Events")}
        onRight={() => {}}
      />
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={{ color: "black", opacity: 0.6 }}>{error}</Text>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={() => (
            <Text style={{ opacity: 0.6 }}>No groups found.</Text>
          )}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => navigation.navigate("GroupDetails", { id: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}
