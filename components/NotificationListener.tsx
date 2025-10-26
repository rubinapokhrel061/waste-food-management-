import { db } from "@/configs/FirebaseConfig";
import * as Notifications from "expo-notifications";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";

export default function NotificationListener() {
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "foods"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          Notifications.scheduleNotificationAsync({
            content: {
              title: "🍱 New Food Posted!",
              body: `${data.foodName} (${data.quantity}) has been added.`,
            },
            trigger: null,
          });
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return null;
}
