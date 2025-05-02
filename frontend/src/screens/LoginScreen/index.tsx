import React, { useState, FormEvent } from "react";
import useLogin from "../../hooks/useLogin";
import {Link, useNavigate} from "react-router-dom";
import "./styles.css";

const LoginScreen: React.FC = () => {
    const { login, loading: loginLoading, error: loginError } = useLogin();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        const user = await login(email, password);
        if (user) {
            navigate("/home");
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h1>Login</h1>

                <form onSubmit={handleLogin}>
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
                    <button className="submit-button" type="submit" disabled={loginLoading}>
                        {loginLoading ? "Logging in..." : "Login"}
                    </button>
                </form>

                {loginError && <p className="error-message">{loginError}</p>}

                <div className="register-link">
                    <p>Don't have an account? <Link to="/register">Register here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
