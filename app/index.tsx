import { auth, db } from "@/configs/FirebaseConfig";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import Landing from "../components/Landing";

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
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
