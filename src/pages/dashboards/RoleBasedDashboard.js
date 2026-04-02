import { Navigate } from "react-router-dom";
import CUDashboard from "./CUDashboard";
import BUDashboard from "./BUDashboard";
import L3Dashboard from "./L3Dashboard";
import RecruiterDashboard from "./RecruiterDashboard";


function RoleBasedDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  // If no user → go to login
  if (!user) {
    return <Navigate to="/" />;
  }

  // Role-based rendering
  switch (user.role) {
    case "CU_MANAGER":
      return <CUDashboard />;

    case "BU_MANAGER":
      return <BUDashboard />;

    case "L3_MANAGER":
      return <L3Dashboard />;

    case "RECRUITER":
      return <RecruiterDashboard />;

    default:
      return <div>No Access</div>;
  }
}

export default RoleBasedDashboard;