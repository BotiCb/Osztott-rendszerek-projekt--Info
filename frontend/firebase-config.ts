import {initializeApp} from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBb7Pc-lcEpwdZut6Tm0G1sa1fd7P3dWjU",
    authDomain: "osztottrendszer-info.firebaseapp.com",
    projectId: "osztottrendszer-info",
    storageBucket: "osztottrendszer-info.firebasestorage.app",
    messagingSenderId: "918531932299",
    appId: "1:918531932299:web:c6a9d05aa0af029939148e",
    measurementId: "G-JMYX2K4ETQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut};
