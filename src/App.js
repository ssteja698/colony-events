import React, { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import AuthScreen from "./screens/AuthScreen";
import ProfileScreen from "./screens/ProfileScreen";
import InterestsScreen from "./screens/InterestsScreen";
import EventDetailsScreen from "./screens/EventDetailsScreen";
import CreateEventScreen from "./screens/CreateEventScreen";
import CreateGroupScreen from "./screens/CreateGroupScreen";
import ExploreEventsScreen from "./screens/ExploreEventsScreen";
import ExploreGroupsScreen from "./screens/ExploreGroupsScreen";
import GroupDetailsScreen from "./screens/GroupDetailsScreen";
import { registerForPushNotificationsAsync } from "./services/notifications";
import { doc, setDoc } from "firebase/firestore";
import { View, ActivityIndicator, Pressable, Text } from "react-native";
import { useFonts } from "expo-font";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// App theme - soft light with indigo accents
const AppTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: "#4f46e5",
		background: "#f7f7fb",
		card: "#ffffff",
		text: "#0f172a",
		border: "#e5e7eb",
		notification: "#4f46e5",
	},
};

function getUserInitials() {
	const u = auth.currentUser;
	const name = u?.displayName || u?.email || "";
	const first = name?.trim()?.charAt(0)?.toUpperCase() || "U";
	const second = name?.split(" ")[1]?.charAt(0)?.toUpperCase() || "";
	return `${first}${second}`;
}

function HeaderAvatar({ navigation }) {
	return (
		<Pressable
			onPress={() => navigation.navigate("Profile")}
			style={{
				width: 36,
				height: 36,
				borderRadius: 18,
				borderWidth: 1,
				alignItems: "center",
				justifyContent: "center",
				marginRight: 8,
			}}
		>
			<Text>{getUserInitials()}</Text>
		</Pressable>
	);
}

function HomeStack({ navigation }) {
	return (
		<Stack.Navigator
			screenOptions={{
				headerStyle: { backgroundColor: AppTheme.colors.card },
				headerTintColor: AppTheme.colors.text,
				headerTitleStyle: { fontWeight: "600" },
		}}
		>
			<Stack.Screen
				name="Interests"
				component={InterestsScreen}
				options={{
					title: "Home",
					headerRight: () => <HeaderAvatar navigation={navigation} />,
				}}
			/>
			<Stack.Screen
				name="EventDetails"
				component={EventDetailsScreen}
				options={{ title: "Event Details" }}
			/>
			<Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: "Create Event" }} />
			<Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: "Create Group" }} />
			<Stack.Screen
				name="GroupDetails"
				component={GroupDetailsScreen}
				options={{ title: "Group Details" }}
			/>
			<Stack.Screen name="Profile" component={ProfileScreen} />
		</Stack.Navigator>
	);
}

function ExploreStack({ navigation }) {
	return (
		<Stack.Navigator
			screenOptions={{
				headerStyle: { backgroundColor: AppTheme.colors.card },
				headerTintColor: AppTheme.colors.text,
				headerTitleStyle: { fontWeight: "600" },
		}}
		>
			<Stack.Screen
				name="Events"
				component={ExploreEventsScreen}
				options={{
					title: "Explore",
					headerRight: () => <HeaderAvatar navigation={navigation} />,
				}}
			/>
			<Stack.Screen
				name="EventDetails"
				component={EventDetailsScreen}
				options={{ title: "Event Details" }}
			/>
			<Stack.Screen
				name="Groups"
				component={ExploreGroupsScreen}
				options={{
					title: "Explore",
					headerRight: () => <HeaderAvatar navigation={navigation} />,
				}}
			/>
			<Stack.Screen
				name="GroupDetails"
				component={GroupDetailsScreen}
				options={{ title: "Group Details" }}
			/>
		</Stack.Navigator>
	);
}

export default function AppRoot() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [fontsLoaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (u) => {
			setUser(u);
			setLoading(false);
			if (u) {
				const token = await registerForPushNotificationsAsync();
				if (token) {
					await setDoc(
						doc(db, "pushTokens", u.uid),
						{ token },
						{ merge: true }
					);
				}
			}
		});
		return () => unsub();
	}, []);

	// Apply global font to Text
	useEffect(() => {
		if (fontsLoaded) {
			Text.defaultProps = Text.defaultProps || {};
			Text.defaultProps.style = [Text.defaultProps.style, { fontFamily: "SpaceMono", color: AppTheme.colors.text }];
		}
	}, [fontsLoaded]);

	if (loading || !fontsLoaded) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: AppTheme.colors.background }}>
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<NavigationContainer theme={AppTheme}>
			{user ? (
				<Tab.Navigator
					screenOptions={{ headerShown: false, tabBarActiveTintColor: AppTheme.colors.primary }}
				>
					<Tab.Screen name="Home" component={HomeStack} />
					<Tab.Screen name="Explore" component={ExploreStack} />
				</Tab.Navigator>
			) : (
				<AuthScreen />
			)}
		</NavigationContainer>
	);
}
