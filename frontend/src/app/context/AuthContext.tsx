import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { safeLocalStorage } from "../utils/localStorage";

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
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  redirectAfterLogin: string | null;
  setRedirectAfterLogin: (url: string | null) => void;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
  redirectAfterLogin: null,
  setRedirectAfterLogin: () => {},
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
  const [isLoading, setIsLoading] = useState(true);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<
    string | null
  >(null);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = safeLocalStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
      safeLocalStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<void> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const userData: User = {
          email,
          name: email.split("@")[0],
          loginTime: new Date().toISOString(),
        };
        setUser(userData);
        try {
          safeLocalStorage.setItem(
            "user",
            JSON.stringify(userData),
          );
        } catch (error) {
          console.error(
            "Error saving user to localStorage:",
            error,
          );
        }
        resolve();
      }, 800);
    });
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<void> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const userData: User = {
          name,
          email,
          registeredAt: new Date().toISOString(),
        };
        setUser(userData);
        try {
          safeLocalStorage.setItem(
            "user",
            JSON.stringify(userData),
          );
        } catch (error) {
          console.error(
            "Error saving user to localStorage:",
            error,
          );
        }
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    try {
      safeLocalStorage.removeItem("user");
    } catch (error) {
      console.error(
        "Error removing user from localStorage:",
        error,
      );
    }
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
    login,
    register,
    logout,
    updateUser,
    redirectAfterLogin,
    setRedirectAfterLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};