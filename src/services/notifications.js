import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  // Web push requires VAPID configuration. Skip silently on web.
  if (Platform.OS === "web") {
    return null;
  }
  try {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    token = (await Notifications.getExpoPushTokenAsync()).data;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    return token;
  } catch (e) {
    // Fail gracefully without crashing the app
    return null;
  }
}

export async function scheduleLocalReminder(
  date,
  minutesBefore = 15,
  content = {}
) {
  const triggerDate = new Date(date);
  triggerDate.setMinutes(triggerDate.getMinutes() - minutesBefore);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: content.title || "Event reminder",
      body: content.body || "Starting soon",
      data: content.data || {},
    },
    trigger: triggerDate,
  });
}
