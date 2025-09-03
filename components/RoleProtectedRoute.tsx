import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth, db } from "../configs/FirebaseConfig";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/auth/sign-in");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!userData || !allowedRoles.includes(userData.role)) {
          // Redirect to appropriate home if role not allowed
          switch (userData?.role) {
            case "donor":
              router.replace("/donor/home");
              break;
            case "ngo":
              router.replace("/ngo/home");
              break;
            case "admin":
              router.replace("/admin/dashboard");
              break;
            default:
              router.replace("/auth/sign-in");
          }
          return;
        }
      } catch (err) {
        console.log(err);
        router.replace("/auth/sign-in");
      } finally {
        setLoading(false);
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

export default RoleProtectedRoute;
