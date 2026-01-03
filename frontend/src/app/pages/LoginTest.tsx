import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from '../context/AuthContext';

const LoginTest = () => {
  const login = async () => {
    const res = await signInWithEmailAndPassword(
      auth,
      "test@gmail.com",
      "password123"
    );

    const token = await res.user.getIdToken();
    console.log("Firebase Token:", token);
  };

  return <button onClick={login}>Login Tests</button>;
};

export default LoginTest;
