import { auth, db } from "@/configs/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface UserData {
  uid: string;
  name: string;
  email: string;
  [key: string]: any;
}

interface UserContextProps {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as UserData);
      } else {
        console.warn("User document not found");
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        fetchUser(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refreshUser: async () => {
          if (auth.currentUser) {
            await fetchUser(auth.currentUser.uid);
          }
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
