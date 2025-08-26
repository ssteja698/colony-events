import React from "react";
import { Pressable, View, Text } from "react-native";
export default function GroupCard({ group, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 }}
    >
      <Text style={{ fontSize: 18 }}>{group.name}</Text>
      <Text numberOfLines={2}>{group.description}</Text>
    </Pressable>
  );
}
