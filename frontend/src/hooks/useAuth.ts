import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useAuth = () => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Check for the token in AsyncStorage when the app loads
        const checkToken = async () => {
            const storedToken = await AsyncStorage.getItem("firebaseToken");
            setToken(storedToken);
        };

        checkToken();
    }, []);

    return token;
};

export default useAuth;
