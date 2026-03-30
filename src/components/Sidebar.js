import "./Sidebar.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-title">Manager Suite</div>
        <div className="brand-subtitle">Requisition Control</div>
      </div>

      <nav className="sidebar-nav">
        <p
          className={isActive("/dashboard") ? "active" : ""}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </p>

        {user?.role === "CU_MANAGER" && (
          <>
            <p
              className={isActive("/create") ? "active" : ""}
              onClick={() => navigate("/create")}
            >
              Create Requisition
            </p>
            <p
              className={isActive("/my") ? "active" : ""}
              onClick={() => navigate("/my")}
            >
              My Requisitions
            </p>
          </>
        )}

        {user?.role === "BU_MANAGER" && (
          <p
            className={isActive("/approvals") ? "active" : ""}
            onClick={() => navigate("/approvals")}
          >
            Pending Approvals
          </p>
        )}

        {user?.role === "L3_MANAGER" && (
          <p
            className={isActive("/approvals") ? "active" : ""}
            onClick={() => navigate("/approvals")}
          >
            Final Approvals
          </p>
        )}

        {user?.role === "RECRUITER" && (
          <>
            <p
              className={isActive("/approved") ? "active" : ""}
              onClick={() => navigate("/approved")}
            >
              Approved Requests
            </p>

            <p
              className={isActive("/closed") ? "active" : ""}
              onClick={() => navigate("/closed")}
            >
              Closed Requests
            </p>
          </>
        )}
      </nav>
    </div>
  );
}

export default Sidebar;