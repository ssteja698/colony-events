import React from "react";
import { Pressable, View, Text } from "react-native";
export default function EventCard({ event, onPress }) {
  const date = event?.dateTime?.toDate ? event.dateTime.toDate() : new Date(event?.dateTime);
  const isPast = date && !isNaN(date.getTime()) ? date.getTime() < Date.now() : false;
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        backgroundColor: isPast ? "#f1f5f9" : "#ffffff",
        borderColor: isPast ? "#cbd5e1" : "#e5e7eb",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 18 }}>{event.name}</Text>
        {isPast && (
          <Text style={{ fontSize: 12, color: "#475569" }}>Past</Text>
        )}
      </View>
      <Text numberOfLines={2} style={{ color: isPast ? "#64748b" : "#334155" }}>
        {event.description}
      </Text>
      <Text style={{ opacity: 0.6 }}>Group: {event.groupName || "public"}</Text>
    </Pressable>
  );
}
