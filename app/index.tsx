import * as Notifications from "expo-notifications";

import Landing from "@/components/Landing";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

const Index = () => {
  const { user, loading } = useUser();
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") alert("Please enable notifications!");
    })();
  }, []);
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") router.push("/admin/dashboard");
      else if (user.role === "ngo") router.push("/ngo/home");
      else if (user.role === "donor") router.push("/donor/home");
    }
  }, [user, loading]);

  if (loading) return null;

  return <Landing />;
};

export default Index;
