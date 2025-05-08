// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import FormScreen from "./screens/FormScreen";
import HomeScreen from "./screens/HomeScreen/HomeScreen";
import useAuth from "./hooks/useAuth";
import LiveResultsScreen from "./screens/LiveResultsScreen/LiveResultsScreen";
import VoterListScreen from "./screens/VoterListScreen/VoterListScreen";

const App: React.FC = () => {
  const token = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />

        {/* Protected routes */}
        {token ? (
          <>
            <Route path="/form" element={<FormScreen />} />
            <Route path="/live-results" element={<LiveResultsScreen />} />
            <Route path="/voter-list" element={<VoterListScreen />} />
            {/* Redirect any unknown to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          // If not authenticated, redirect attempts to protected routes → login
          <>
            <Route path="/form" element={<Navigate to="/login" />} />
            <Route path="/live-results" element={<Navigate to="/login" />} />
            <Route path="/voter-list" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;
