import React from "react";
import { Pressable, Text } from "react-native";
export default function GroupCard({ group, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        padding: 16,
        marginBottom: 8,
        cursor: "pointer",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <Text style={{ fontSize: 18 }}>{group.name}</Text>
      <Text numberOfLines={2}>{group.description}</Text>
    </Pressable>
  );
}
