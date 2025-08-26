import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator } from "react-native";
import { db, auth } from "../firebase";
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

export default function GroupDetailsScreen({ route }) {
  const { id } = route.params;
  const [group, setGroup] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    async function load() {
      const g = await getDoc(doc(db, "groups", id));
      const data = { id: g.id, ...g.data() };
      setGroup(data);
      const uid = auth.currentUser?.uid;
      setIsMember(!!data.members?.includes(uid));
    }
    load();
  }, [id]);

  if (!group) return null;

  async function join() {
    setLoadingAction(true);
    await updateDoc(doc(db, "groups", id), {
      members: arrayUnion(auth.currentUser.uid),
    });
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      groups: arrayUnion(id),
    });
    setIsMember(true);
    setLoadingAction(false);
  }

  async function exit() {
    setLoadingAction(true);
    await updateDoc(doc(db, "groups", id), {
      members: arrayRemove(auth.currentUser.uid),
    });
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      groups: arrayRemove(id),
    });
    const eventsSnap = await getDocs(query(collection(db, "events"), where("groupId", "==", id)));
    const eventIds = eventsSnap.docs.map((d) => d.id);
    if (eventIds.length) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const interests = userDoc.data()?.interests || [];
      const filtered = interests.filter((eid) => !eventIds.includes(eid));
      await updateDoc(userRef, { interests: filtered });
    }
    setIsMember(false);
    setLoadingAction(false);
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22 }}>{group.name}</Text>
      <Text>{group.description}</Text>
      <View style={{ height: 12 }} />
      {loadingAction ? (
        <ActivityIndicator />
      ) : isMember ? (
        <Button title="Exit" onPress={exit} />
      ) : (
        <Button title="Join" onPress={join} />
      )}
    </View>
  );
}
