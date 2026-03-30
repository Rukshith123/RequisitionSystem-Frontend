import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RoleBasedDashboard from "./pages/dashboards/RoleBasedDashboard";
import CreateRequisition from "./pages/CreateRequisition";
import MyRequisitions from "./pages/MyRequisitions";
import RequisitionDetails from "./pages/RequisitionDetails";
import Approvals from "./pages/Approvals";
import ApprovedRequests from "./pages/ApprovedRequests";
import RejectedRequests from "./pages/RejectedRequests";
import ClosedRequests from "./pages/ClosedRequests";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<RoleBasedDashboard />} />
        <Route path="/create" element={<CreateRequisition />} />
        <Route path="/my" element={<MyRequisitions />} />
        <Route path="/requisition/:id" element={<RequisitionDetails />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/approved" element={<ApprovedRequests />} />
        <Route path="/rejected" element={<RejectedRequests />} />
        <Route path="/closed" element={<ClosedRequests />} />
      </Routes>
    </Router>
  );
}

export default App;
