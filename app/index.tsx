// import { auth } from "@/configs/FirebaseConfig";
// import { Redirect } from "expo-router";
// import Landing from "../components/Landing";

// const Index = () => {
//   const user = auth.currentUser;

//   if (user) {
//     return <Redirect href="/admin/dashboard" />;
//   }

//   return <Landing />;
// };

// export default Index;

import { auth, db } from "@/configs/FirebaseConfig";
import { useRouter } from "expo-router"; // Import useRouter from expo-router
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import Landing from "../components/Landing";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter(); // Initialize useRouter hook

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role || null);
          } else {
            setRole(null);
          }
        } catch (err) {
          console.log("Error fetching user role:", err);
          setRole(null);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return null;
  }

  // Use router.push for navigation based on role
  if (role === "admin") {
    router.push("/admin/dashboard");
  } else if (role === "ngo") {
    router.push("/ngo/home");
  } else if (role === "donor") {
    router.push("/donor/home");
  }

  return <Landing />;
};

export default Index;

// app/index.tsx
// import React from "react";
// import { Text, View } from "react-native";

// const HomeScreen = () => {
//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text>Welcome to the Waste Food Management App!</Text>
//     </View>
//   );
// };

// export default HomeScreen; // This must be a default export

// import { auth, db } from "@/configs/FirebaseConfig";
// import { useRouter } from "expo-router";
// import { doc, getDoc } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import "react-native-reanimated";
// import Landing from "../components/Landing";
// const Index = () => {
//   const [loading, setLoading] = useState(true);
//   const [role, setRole] = useState<string | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     // Listen for auth state changes
//     const unsubscribe = auth.onAuthStateChanged(async (user) => {
//       if (user?.uid) {
//         try {
//           const userDoc = await getDoc(doc(db, "users", user.uid));
//           if (userDoc.exists()) {
//             setRole(userDoc.data().role || null);
//           } else {
//             setRole(null);
//           }
//         } catch (err) {
//           console.log("Error fetching user role:", err);
//           setRole(null);
//         }
//       } else {
//         setRole(null);
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe(); // clean up listener
//   }, []);
//   useEffect(() => {
//     if (!loading && role) {
//       if (role === "admin") router.replace("/admin/dashboard");
//       else if (role === "ngo") router.replace("/ngo/home");
//       else router.replace("/donor/home");
//     }
//   }, [loading, role, router]);

//   if (loading) return null;

//   return <Landing />;
// };

// export default Index;
