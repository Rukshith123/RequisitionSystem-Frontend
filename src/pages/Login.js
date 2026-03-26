import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  // Step 1: create state for input fields
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: handle login click
  const handleLogin = () => {
    console.log("Username:", username);
    console.log("Password:", password);

    navigate("/dashboard");
  };

  return (
    <div>
      <h2>Login Page</h2>

      {/* Username Input */}
      <input
        type="text"
        placeholder="Enter Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <br /><br />

      {/* Password Input */}
      <input
        type="password"
        placeholder="Enter Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      {/* Login Button */}
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;