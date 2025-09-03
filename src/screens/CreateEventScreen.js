import DateTimePicker from "@react-native-community/datetimepicker";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../firebase";

const WEEKDAYS = ["M", "T", "W", "T2", "F", "S", "S2"];

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

export default function CreateEventScreen({ navigation }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");
  const [occurs, setOccurs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(idx) {
    setOccurs((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function openPicker() {
    if (Platform.OS === "android") {
      setPickerMode("date");
      setShowPicker(true);
    } else {
      setPickerMode("datetime");
      setShowPicker(true);
    }
  }

  function onChangeDate(event, selectedDate) {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setShowPicker(false);
        return;
      }
      if (pickerMode === "date") {
        const d = selectedDate || date;
        setDate(d);
        setPickerMode("time");
        setShowPicker(true);
        return;
      }
      if (pickerMode === "time") {
        const d = selectedDate || date;
        const merged = new Date(date);
        merged.setHours(d.getHours());
        merged.setMinutes(d.getMinutes());
        setDate(merged);
        setShowPicker(false);
        return;
      }
    } else {
      const currentDate = selectedDate || date;
      setDate(currentDate);
      setShowPicker(Platform.OS === "ios");
    }
  }

  async function submit() {
    if (!name.trim()) {
      showAlert("Missing event name", "Please enter event name.");
      return;
    }
    if (!organizerName.trim()) {
      showAlert("Missing organizer", "Please enter organizer name.");
      return;
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      showAlert("Missing time", "Please pick event date and time.");
      return;
    }

    const qDup = query(
      collection(db, "events"),
      where("name", "==", name.trim())
    );
    const dupSnap = await getDocs(qDup);
    if (!dupSnap.empty) {
      showAlert("Duplicate name", "An event with this name already exists.");
      return;
    }

    setSubmitting(true);
    await addDoc(collection(db, "events"), {
      name: name.trim(),
      description,
      organizer: auth.currentUser.uid,
      organizerName: organizerName.trim(),
      groupId: "public",
      groupName: "public",
      occursEvery: occurs,
      dateTime: date.toISOString(),
      createdAt: serverTimestamp(),
    });
    setSubmitting(false);
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Event Name"
        style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Event Description"
        style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
        value={description}
        onChangeText={setDescription}
      />
      <Text style={{ marginBottom: 6 }}>Event Time</Text>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
        <Pressable
          onPress={openPicker}
          style={{
            flex: 1,
            borderWidth: 1,
            padding: 12,
            borderRadius: 6,
            marginRight: 8,
          }}
        >
          <Text>{date.toLocaleString()}</Text>
        </Pressable>
        <Button title="Pick" onPress={openPicker} />
      </View>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode={pickerMode === "datetime" ? "datetime" : pickerMode}
          is24Hour={true}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onChangeDate}
        />
      )}
      <Text style={{ marginBottom: 6 }}>Occurs every</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
        {WEEKDAYS.map((label, idx) => (
          <Pressable
            key={idx}
            onPress={() => toggleDay(idx)}
            style={{
              width: 44,
              paddingVertical: 8,
              borderWidth: 1,
              borderRadius: 8,
              marginRight: 8,
              marginBottom: 8,
              alignItems: "center",
              backgroundColor: occurs.includes(idx) ? "#e5e7eb" : "#fff",
            }}
          >
            <Text>{label.replace("2", "")}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        placeholder="Event organizer"
        style={{ borderWidth: 1, padding: 10, marginBottom: 8 }}
        value={organizerName}
        onChangeText={setOrganizerName}
      />
      {submitting ? (
        <ActivityIndicator />
      ) : (
        <Button title="Submit" onPress={submit} />
      )}
    </View>
  );
}
