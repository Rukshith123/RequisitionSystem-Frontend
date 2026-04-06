import { Navigate } from "react-router-dom";
import CUDashboard from "./CUDashboard";
import BUDashboard from "./BUDashboard";
import BADashboard from "./BADashboard";
import RecruiterDashboard from "./RecruiterDashboard";

function RoleBasedDashboard() {
  const userStr = localStorage.getItem("user");

  // Guard — catches null, undefined string, or broken JSON
  if (!userStr || userStr === "undefined" || userStr === "null") {
    return <Navigate to="/" />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem("user");
    return <Navigate to="/" />;
  }

  if (!user || !user.role) {
    return <Navigate to="/" />;
  }

  switch (user.role) {
    case "CU_MANAGER":
      return <CUDashboard />;
    case "BU_MANAGER":
      return <BUDashboard />;
    case "BA_MANAGER":
      return <BADashboard />;
    case "Recruiter":
      return <RecruiterDashboard />;
    default:
      return <div>No Access</div>;
  }
}

export default RoleBasedDashboard;