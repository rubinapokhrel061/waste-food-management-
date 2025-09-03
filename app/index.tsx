import { auth } from "@/configs/FirebaseConfig";
import { Redirect } from "expo-router";
import Landing from "../components/Landing";

const Index = () => {
  const user = auth.currentUser;

  if (user) {
    return <Redirect href="/fooditems" />;
  }

  return <Landing />;
};

export default Index;
