import "../styles/Dashboard.css";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyRequisitions } from "../services/api";


function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    const data = await getMyRequisitions(user.username);

    calculateStats(data);
  };

  const calculateStats = (data) => {
    let total = data.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    data.forEach((item) => {
      if (item.status === "Pending") pending++;
      if (item.status === "BUApproved" || item.status === "L3Approved") approved++;
      if (item.status === "Rejected" || item.status === "BURejected" || item.status === "BARejected") rejected++;
    });

    setStats({ total, pending, approved, rejected });
  };

  return (
    <Layout>
      {/* Welcome Section */}
      <h2>Welcome, {user?.username} 👋</h2>

      <div className="stats-container">
        <div className="stat-box stat-card" onClick={() => navigate("/my")}>
          <p className="stat-title">OPEN REQUISITIONS</p>
          <h2 className="stat-value">{stats.total}</h2>
          <p className="stat-subtext">Total requests created</p>
        </div>

        <div className="stat-box stat-card" onClick={() => navigate("/my?status=Pending")}>
          <p className="stat-title">PENDING APPROVALS</p>
          <h2 className="stat-value">{stats.pending}</h2>
          <p className="stat-subtext">Awaiting approval</p>
        </div>

        <div className="stat-box stat-card" onClick={() => navigate("/my?status=Approved")}>
          <p className="stat-title">APPROVED</p>
          <h2 className="stat-value">{stats.approved}</h2>
          <p className="stat-subtext">Approved requests</p>
        </div>

        <div className="stat-box stat-card" onClick={() => navigate("/my?status=Rejected")}>
          <p className="stat-title">REJECTED</p>
          <h2 className="stat-value">{stats.rejected}</h2>
          <p className="stat-subtext">Rejected requests</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">

        {/* CU Manager Actions */}
        {user?.role === "CU_MANAGER" && (
          <>
            <div className="card" onClick={() => navigate("/create")}>
              Create Requisition
            </div>

            <div className="card" onClick={() => navigate("/my")}>
              My Requisitions
            </div>
          </>
        )}

        {/* BU Manager Actions */}
        {user?.role === "BU_MANAGER" && (
          <>
            <div className="card" onClick={() => navigate("/approvals")}>
              View Pending Approvals
            </div>
          </>
        )}

        {/* BA Manager Actions */}
        {user?.role === "BA_MANAGER" && (
          <>
            <div className="card" onClick={() => navigate("/approvals")}>
              View Final Approvals
            </div>
          </>
        )}

        {/* Recruiter Actions */}
        {user?.role === "Recruiter" && (
          <>
            <div className="card">
              View Approved Requisitions
            </div>
          </>
        )}

      </div>
    </Layout>
  );
}

export default Dashboard;