import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { safeLocalStorage } from "../utils/localStorage";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { auth } from "../../firebase";

interface Address {
  id: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

interface User {
  name: string;
  email: string;
  registeredAt?: string;
  loginTime?: string;
  addresses?: Address[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  redirectAfterLogin: string | null;
  setRedirectAfterLogin: (url: string | null) => void;
  getIdToken: () => Promise<string | null>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  firebaseUser: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
  redirectAfterLogin: null,
  setRedirectAfterLogin: () => {},
  getIdToken: async () => null,
};

const AuthContext = createContext<AuthContextType>(
  defaultAuthContext,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<
    string | null
  >(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUserObj) => {
      try {
        if (firebaseUserObj) {
          setFirebaseUser(firebaseUserObj);
          // Get Firebase ID token
          const token = await firebaseUserObj.getIdToken();
          safeLocalStorage.setItem("authToken", token);
          
          const userData: User = {
            email: firebaseUserObj.email || "",
            name: firebaseUserObj.displayName || firebaseUserObj.email?.split("@")[0] || "",
            loginTime: new Date().toISOString(),
          };
          setUser(userData);
          safeLocalStorage.setItem("user", JSON.stringify(userData));
        } else {
          setFirebaseUser(null);
          setUser(null);
          safeLocalStorage.removeItem("authToken");
          safeLocalStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<void> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      
      // Token will be set by onAuthStateChanged
      const token = await userCredential.user.getIdToken();
      safeLocalStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      
      // Token will be set by onAuthStateChanged
      const token = await userCredential.user.getIdToken();
      safeLocalStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      safeLocalStorage.removeItem("authToken");
      safeLocalStorage.removeItem("user");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        return token;
      } catch (error) {
        console.error("Error getting ID token:", error);
        return null;
      }
    }
    return null;
  };



  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      try {
        safeLocalStorage.setItem(
          "user",
          JSON.stringify(updatedUser),
        );
      } catch (error) {
        console.error(
          "Error updating user in localStorage:",
          error,
        );
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    firebaseUser,
    login,
    register,
    logout,
    updateUser,
    redirectAfterLogin,
    setRedirectAfterLogin,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};