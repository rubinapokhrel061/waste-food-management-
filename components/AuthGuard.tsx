import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth, db } from "../configs/FirebaseConfig";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const role = userDoc.data()?.role;

          switch (role) {
            case "admin":
              router.replace("/admin/dashboard");
              break;
            case "ngo":
              router.replace("/ngo/home");
              break;
            case "donor":
              router.replace("/donor/home");
              break;
            default:
              router.replace("/");
          }
        } catch (err) {
          router.replace("/");
        }
      } else {
        setLoading(false); // allow access to auth pages
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
