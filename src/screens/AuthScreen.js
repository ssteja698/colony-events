import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState("login");

  async function submit() {
    if (mode === "login") {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = name?.trim() || email.split("@")[0];
      await updateProfile(cred.user, { displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        name: displayName,
        groups: [],
        interests: [],
      }, { merge: true });
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, textAlign: "center", marginBottom: 24 }}>
        {mode === "login" ? "Login" : "Sign Up"}
      </Text>
      {mode === "signup" && (
        <TextInput
          placeholder="Name"
          style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
        value={password}
        onChangeText={setPassword}
      />
      <Button title={mode === "login" ? "Login" : "Sign Up"} onPress={submit} />
      <View style={{ height: 12 }} />
      <Button
        title={`Switch to ${mode === "login" ? "Sign Up" : "Login"}`}
        onPress={() => setMode(mode === "login" ? "signup" : "login")}
      />
    </View>
  );
}
