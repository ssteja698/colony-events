import React, { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function ProfileScreen() {
  const user = auth.currentUser;
  const [name, setName] = useState(user?.displayName || user?.email?.split("@")[0]);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const n = snap.data()?.name;
      if (n) setName(n);
    });
  }, [user?.uid]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 8 }}>Profile</Text>
      <Text>Name: {name}</Text>
      <Text>Email: {user?.email}</Text>
      <View style={{ height: 24 }} />
      <Button title="Logout" onPress={() => signOut(auth)} />
    </View>
  );
}
