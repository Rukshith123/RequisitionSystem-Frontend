import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (event) => {
    event.preventDefault();

    let user;

    if (username === "raj" && password === "raj123") {
      user = { id: 1, username: "raj", role: "CU_MANAGER" };
    } else if (username === "amit" && password === "amit123") {
      user = { id: 2, username: "amit", role: "BU_MANAGER" };
    } else if (username === "sneha" && password === "sneha123") {
      user = { id: 3, username: "sneha", role: "L3_MANAGER" };
    } else if (username === "priya" && password === "priya123") {
      user = { id: 4, username: "priya", role: "RECRUITER" };
    } else {
      alert("Invalid user");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    navigate("/dashboard");
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