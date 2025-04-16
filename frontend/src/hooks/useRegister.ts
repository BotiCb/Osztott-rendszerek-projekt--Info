import {useState} from "react";
import {auth, createUserWithEmailAndPassword} from '../../firebase-config';
import AsyncStorage from "@react-native-async-storage/async-storage";

const useRegister = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const register = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('User registered:', user);

            const idToken = await user.getIdToken();

            await AsyncStorage.setItem('firebaseToken', idToken);
            console.log('Token stored:', idToken);

            setLoading(false);
            return user;
        } catch (err) {
            console.error("Error registering user:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    return { register, loading, error };
};

export default useRegister;
