import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { loginUser } from "../services/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const result = await loginUser(username, password);

      //store token
      localStorage.setItem("token", result.token);

      //store user
      localStorage.setItem("user", JSON.stringify(result.user));

      navigate("/dashboard");

    } catch (error) {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-brand">
          <div className="brand-badge">
            <img src="/nexer-logo.png" alt="Nexer logo" className="brand-logo" />
          </div>
          <h1>Enterprise Requisition Portal</h1>
          <p>Secure Access & Approval Workflow System</p>
        </div>

        <div className="login-container">
          <div className="login-card">
            <h2>Sign In</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="forgot-link">
                <a href="#">Forgot Password?</a>
              </div>

              <button type="submit">Sign In</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;