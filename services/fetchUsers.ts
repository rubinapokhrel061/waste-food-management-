// /services/fetchUsers.ts
import { db } from "@/configs/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const fetchUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersData: User[] = [];
    querySnapshot.forEach((doc) => {
      usersData.push({ id: doc.id, ...doc.data() } as User);
    });
    return usersData;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to load users");
  }
};
