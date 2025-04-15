import { useState } from "react";
import {auth, signInWithEmailAndPassword} from '../../firebase-config';
import AsyncStorage from "@react-native-async-storage/async-storage";

const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('User logged in:', user);

            const idToken = await user.getIdToken();

            await AsyncStorage.setItem('firebaseToken', idToken);
            console.log('Token stored:', idToken);

            setLoading(false);
            return user;
        } catch (err) {
            console.error("Error logging in user:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    return { login, loading, error };
};

export default useLogin;
