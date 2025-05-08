import React, { useState, FormEvent } from "react";
import useRegister from "../../hooks/useRegister";
import { Link, useNavigate } from "react-router-dom";
import "./styles.css";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RegisterScreen: React.FC = () => {
  const {
    register,
    loading: registerLoading,
    error: registerError,
  } = useRegister();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    const user = await register(email, password);
    if (user) {
      navigate("/login");
      try {
        const profile = await axios.post(
          "http://localhost:3000/user/register",
          {
            email,
            password,
            username: user.displayName
              ? "User_" + user.email
              : "default_user_no_" + user.metadata.creationTime,
            fullname: user.displayName + "_no_x",
          }
        );
        AsyncStorage.setItem("id", JSON.stringify(profile.data.id));
        AsyncStorage.setItem("username", JSON.stringify(profile.data.username));
        console.log(profile);
      } catch (err) {
        console.error("Error registering user:", err);
      }
    }
  };

  return (
    <div className="register-container">
      <h1>Register</h1>

      <form onSubmit={handleRegister}>
        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="submit-button"
          type="submit"
          disabled={registerLoading}
        >
          {registerLoading ? "Registering..." : "Register"}
        </button>
      </form>

      {registerError && <p className="error-message">{registerError}</p>}

      <div className="login-link">
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
