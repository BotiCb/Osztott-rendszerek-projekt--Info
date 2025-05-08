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
import useAuth from "./hooks/useAuth"; // Your custom hook to check for token
import LiveResultsScreen from "./screens/LiveResultsScreen/LiveResultsScreen";

const App: React.FC = () => {
  const token = useAuth();

  if (token === null) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/form" element={<FormScreen />} />
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
        <Route path="/" element={<Navigate to="/form" />} />
        <Route path="/live-results" element={<LiveResultsScreen />} />
      </Routes>
    </Router>
  );
};

export default App;
