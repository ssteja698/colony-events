import { collection, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
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
          borderRadius: 8,
          marginRight: 6,
          backgroundColor: leftSelected ? "#2563eb" : "#fff",
          alignItems: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Text
          style={{
            color: leftSelected ? "#fff" : "#222",
          }}
        >
          {leftLabel}
        </Text>
      </Pressable>
      <Pressable
        onPress={onRight}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 8,
          marginLeft: 6,
          backgroundColor: !leftSelected ? "#2563eb" : "#fff",
          alignItems: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Text
          style={{
            color: !leftSelected ? "#fff" : "#222",
          }}
        >
          {rightLabel}
        </Text>
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
              onPress={() =>
                navigation.navigate("GroupDetails", { id: item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}
