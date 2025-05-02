import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import FormScreen from "./screens/FormScreen";
import useAuth from "./hooks/useAuth"; // Your custom hook to check for token
import HomeScreen from './screens/HomeScreen';
import VoteScreen from './screens/VoteScreen';
import ResultScreen from './screens/ResultsScreen';
import FillFormScreen from "./screens/FillFormScreen";

const App: React.FC = () => {
    const token = useAuth();

    if (token === null) {
        return (
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/register" element={<RegisterScreen />} />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/form" element={<FormScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />
                <Route path="/" element={<Navigate to="/login" />} />

                <Route path="/home" element={<HomeScreen />} />
                <Route path="/vote" element={<VoteScreen />} />
                <Route path="/results" element={<ResultScreen />} />
                <Route path="/fill/:formName" element={<FillFormScreen />} />
            </Routes>
        </Router>
    );
};

export default App;
