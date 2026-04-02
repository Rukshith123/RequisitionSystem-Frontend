import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyRequisitions } from "../../services/api";
import "../../styles/Dashboard.css";

function CUDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    buApproved: 0,
    l3Approved: 0,
    closed: 0,
    rejected: 0
  });
  const [requisitions, setRequisitions] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const data = await getMyRequisitions(user.id);
    const sorted = [...data].sort((a, b) => b.id - a.id);
    setRequisitions(sorted);
    calculateStats(data);
  };

  const calculateStats = (data) => {
    let total = data.length;
    let pending = 0;
    let buApproved = 0;
    let l3Approved = 0;
    let closed = 0;
    let rejected = 0;

    data.forEach((item) => {
      if (item.status === "Pending") pending++;
      if (item.status === "BUApproved") buApproved++;
      if (item.status === "L3Approved") l3Approved++;
      if (item.status === "Closed") closed++;
      if (item.status === "Rejected") rejected++;
    });

    setStats({
      total,
      pending,
      buApproved,
      l3Approved,
      closed,
      rejected
    });
  };

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>My Requisitions View</h1>
        <p>
          Manage and monitor your hiring requests. Track team demand and submit
          clean requisitions with complete details.
        </p>
      </section>

      <div className="stats-container">

      <div className="stat-card stat-total" onClick={() => navigate("/my")}>
        <p className="stat-title">TOTAL</p>
        <h2 className="stat-value">{stats.total}</h2>
      </div>

      <div className="stat-card stat-pending" onClick={() => navigate("/my?status=Pending")}>
        <p className="stat-title">PENDING</p>
        <h2 className="stat-value">{stats.pending}</h2>
      </div>

      <div className="stat-card stat-bu" onClick={() => navigate("/my?status=BUApproved")}>
        <p className="stat-title">BU APPROVED</p>
        <h2 className="stat-value">{stats.buApproved}</h2>
      </div>

      <div className="stat-card stat-l3" onClick={() => navigate("/my?status=L3Approved")}>
        <p className="stat-title">L3 APPROVED</p>
        <h2 className="stat-value">{stats.l3Approved}</h2>
      </div>
      <div className="stat-card stat-closed" onClick={() => navigate("/my?status=Closed") }>
        <p className="stat-title">CLOSED</p>
        <h2 className="stat-value">{stats.closed}</h2>
      </div>
      <div className="stat-card stat-rejected" onClick={() => navigate("/my?status=Rejected")}>
        <p className="stat-title">REJECTED</p>
        <h2 className="stat-value">{stats.rejected}</h2>
      </div>

    </div>

      <div className="dashboard-actions dashboard-actions-center dashboard-actions-cu">
        <div className="card action-button" onClick={() => navigate("/create")}>
          Create Requisition
        </div>

        <div className="card action-button" onClick={() => navigate("/my")}>
          My Requisitions
        </div>
      </div>

      <div className="active-requisitions">
        <div className="section-header">
          <h3>Active Requisitions</h3>
          
        </div>
        <div className="table-wrapper">
          <table className="requisition-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>ID</th>
                <th>Department</th>
                <th>Skillset</th>
                <th>Experience</th>
                <th>Positions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map((req) => (
                <tr key={req.id}>
                  <td
                    className="req-id"
                    onClick={() => navigate(`/requisition/${req.id}`, { state: { fromDashboard: "/dashboard" } })}
                  >
                    {req.title || req.requisitionTitle || req.jobTitle || req.position || req.postTitle || "Untitled requisition"}
                  </td>
                  <td>{req.id}</td>
                  <td>{req.department || "-"}</td>
                  <td>{req.skillset || "-"}</td>
                  <td>{req.experienceLevel || "-"}</td>
                  <td>{req.numberOfPositions ?? "-"}</td>
                  <td>
                    <span className={`status-badge status-${(req.status || "").toLowerCase()}`}>
                      {req.status || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default CUDashboard;