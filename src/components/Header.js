import "./Header.css";
import { logoutUser } from "../services/api";

function Header() {
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = async () => {
    await logoutUser();
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="header">
      <div className="header-left">
        <img src="/nexer-logo.png" alt="Nexer Logo" className="logo-img" />
        <span className="app-name">Requisition Hub</span>
      </div>

      <div className="header-right">
        <span className="user-greeting">Hi, {user?.username}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Header;