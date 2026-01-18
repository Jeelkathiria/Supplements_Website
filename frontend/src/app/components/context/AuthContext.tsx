import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { safeLocalStorage } from "../../utils/localStorage";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "../../../firebase";

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
  phone?: string;
  registeredAt?: string;
  loginTime?: string;
  addresses?: Address[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  redirectAfterLogin: string | null;
  setRedirectAfterLogin: (url: string | null) => void;
  getIdToken: () => Promise<string | null>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  firebaseUser: null,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
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
          
          // Sync user with backend - send email and name
          let backendUser = null;
          try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
            const response = await fetch(`${API_BASE_URL}/user/sync`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: firebaseUserObj.email,
                name: firebaseUserObj.displayName  // Send Firebase displayName if available
              })
            });
            
            if (response.ok) {
              backendUser = await response.json();
            } else {
              console.error("Failed to sync user with backend");
            }
          } catch (error) {
            console.error("Error syncing user:", error);
          }
          
          // Use name and phone from backend (database) - don't fall back to email prefix
          const userData: User = {
            email: firebaseUserObj.email || "",
            name: backendUser?.name && backendUser.name.trim() ? backendUser.name : (firebaseUserObj.displayName || ""),
            phone: backendUser?.phone || "",
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
      // Normalize email - trim whitespace and convert to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );
      
      // Token will be set by onAuthStateChanged
      const token = await userCredential.user.getIdToken();
      safeLocalStorage.setItem("authToken", token);
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/invalid-credential') {
        const customError = new Error('Invalid email or password. Please check and try again.');
        (customError as any).code = 'auth/invalid-credential';
        throw customError;
      } else if (error.code === 'auth/user-not-found') {
        const customError = new Error('No account found with this email. Please register first.');
        (customError as any).code = 'auth/user-not-found';
        throw customError;
      } else if (error.code === 'auth/wrong-password') {
        const customError = new Error('Incorrect password. Please try again.');
        (customError as any).code = 'auth/wrong-password';
        throw customError;
      }
      
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
  ): Promise<void> => {
    try {
      // Normalize email - trim whitespace and convert to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );
      
      // Store the name and phone in the database via backend sync
      const token = await userCredential.user.getIdToken();
      safeLocalStorage.setItem("authToken", token);
      
      // Sync user with backend to store the name and phone in database
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_BASE_URL}/user/sync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            name: name.trim(),  // Send the name entered during registration
            phone: phone.trim()  // Send the phone number
          })
        });
        
        if (!response.ok) {
          console.error("Error syncing user during registration:", response.statusText);
        }
      } catch (error) {
        console.error("Error syncing user during registration:", error);
        // Don't fail registration if sync fails, it will sync again on auth state change
      }
    } catch (error: any) {
      console.error("Register error:", error);
      
      // Preserve Firebase error code for handling in component
      if (error.code === 'auth/email-already-in-use') {
        const customError = new Error('This email is already registered. Please login instead.');
        (customError as any).code = 'auth/email-already-in-use';
        throw customError;
      } else if (error.code === 'auth/weak-password') {
        const customError = new Error('Password is too weak. Please choose a stronger password.');
        (customError as any).code = 'auth/weak-password';
        throw customError;
      } else if (error.code === 'auth/invalid-email') {
        const customError = new Error('Invalid email address. Please check and try again.');
        (customError as any).code = 'auth/invalid-email';
        throw customError;
      }
      
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Token will be set by onAuthStateChanged
      const token = await userCredential.user.getIdToken();
      safeLocalStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Google login error:", error);
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
    isLoading,
    firebaseUser,
    login,
    register,
    loginWithGoogle,
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