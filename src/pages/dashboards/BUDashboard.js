import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMyApprovals, getPendingApprovals, getRequisitionById } from "../../services/api";
import "../../styles/Dashboard.css";

function BUDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
    });
  const [history, setHistory] = useState([]);
  useEffect(() => {
    fetchStats();
    }, []);

    const fetchStats = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    // ✅ 1. Get pending approvals (for BU)
    const pendingData = await getPendingApprovals(user.role);

    // ✅ 2. Get approvals done by THIS user
    const approvalsData = await getMyApprovals(user.id);

    let approved = 0;
    let rejected = 0;

    const buHistory = approvalsData.filter((item) => item.approvalLevel === "BU");

    buHistory.forEach((item) => {
      if (item.status === "Approved" && item.approvalLevel === "BU") {
        approved++;
      }
      if (item.status === "Rejected" && item.approvalLevel === "BU") {
        rejected++;
      }
    });

    const detailedHistory = await Promise.all(
      buHistory
        .sort((left, right) => new Date(right.actionDate) - new Date(left.actionDate))
        .slice(0, 6)
        .map(async (item) => {
          try {
            const requisition = await getRequisitionById(item.requisitionId);

            return {
              ...item,
              title: requisition.title,
              department: requisition.department
            };
          } catch (error) {
            return item;
          }
        })
    );

    setHistory(detailedHistory);

    setStats({
      pending: pendingData.length,
      approved,
      rejected
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
  }
};

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>BU Approvals View</h1>
        <p>
          Monitor incoming approvals, review decisions, and keep business unit
          hiring requests moving without delays.
        </p>
      </section>

      {/* Stats Section (temporary static) */}
      <div className="stats-container">
        <div className="stat-card stat-pending" onClick={() => navigate("/approvals")}>
          <p className="stat-title">PENDING APPROVALS</p>
          <h2 className="stat-value">{stats.pending}</h2>
        </div>

        <div className="stat-card stat-bu" onClick={() => navigate("/approved")}>
          <p className="stat-title">APPROVED</p>
          <h2 className="stat-value">{stats.approved}</h2>
        </div>

        <div className="stat-card stat-rejected" onClick={() => navigate("/rejected")}>
          <p className="stat-title">REJECTED</p>
          <h2 className="stat-value">{stats.rejected}</h2>
        </div>
      </div>

      {/* Action */}
      <div className="dashboard-actions dashboard-actions-center dashboard-actions-cu">
        <div className="card action-button" onClick={() => navigate("/approvals")}>
          Go to Approvals
        </div>
      </div>

      <section className="active-requisitions">
        <div className="section-header">
          <h3>Recent Approval History</h3>
          <p>Your latest approval decisions</p>
        </div>

        {history.length === 0 ? (
          <div className="dashboard-history-empty">No approval history available yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="requisition-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Decision</th>
                  <th>Comment</th>
                  <th>Action Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td
                      className="req-id"
                      onClick={() => navigate(`/requisition/${item.requisitionId}`, { state: { fromDashboard: "/dashboard" } })}
                    >
                      {item.title || "Untitled requisition"}
                    </td>
                    <td>{item.requisitionId}</td>
                    <td>{item.department || "-"}</td>
                    <td>
                      <span className={`status-badge status-${(item.status || "").toLowerCase()}`}>
                        {item.status || "Unknown"}
                      </span>
                    </td>
                    <td>{item.comments || "-"}</td>
                    <td>{item.actionDate ? new Date(item.actionDate).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}

export default BUDashboard;