import { auth } from "@/configs/FirebaseConfig";
import { signOut } from "firebase/auth";

export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.log("Logout error:", error);
    return false;
  }
};
