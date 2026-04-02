import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyApprovals, getPendingApprovals, getRequisitionById } from "../../services/api";
import "../../styles/Dashboard.css";

function L3Dashboard() {
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

      // 🔹 Pending (BUApproved)
      const pendingData = await getPendingApprovals(user.role);

      // 🔹 My approvals (L3 actions)
      const approvals = await getMyApprovals(user.id);

      let approved = 0;
      let rejected = 0;

      const l3History = approvals.filter((item) => item.approvalLevel === "L3");

      l3History.forEach((item) => {
        if (item.status === "Approved" && item.approvalLevel === "L3") {
          approved++;
        }
        if (item.status === "Rejected" && item.approvalLevel === "L3") {
          rejected++;
        }
      });

      const detailedHistory = await Promise.all(
        l3History
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
      console.error(error);
    }
    };

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>L3 Final Approval View</h1>
        <p>
          Track final-stage approvals, close pending decisions quickly, and
          maintain a smooth hiring process across teams.
        </p>
      </section>

      <div className="stats-container">

        <div
          className="stat-card stat-pending"
          onClick={() => navigate("/approvals")}
        >
          <p className="stat-title">PENDING</p>
          <h2 className="stat-value">{stats.pending}</h2>
        </div>

        <div
          className="stat-card stat-l3"
          onClick={() => navigate("/approved")}
        >
          <p className="stat-title">APPROVED</p>
          <h2 className="stat-value">{stats.approved}</h2>
        </div>

        <div
          className="stat-card stat-rejected"
          onClick={() => navigate("/rejected")}
        >
          <p className="stat-title">REJECTED</p>
          <h2 className="stat-value">{stats.rejected}</h2>
        </div>

      </div>

      <div className="dashboard-actions dashboard-actions-center dashboard-actions-cu">
        <div className="card action-button" onClick={() => navigate("/approvals")}>
          Go to Final Approvals
        </div>
      </div>

      <section className="active-requisitions">
        <div className="section-header">
          <h3>Recent Final Approval History</h3>
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

export default L3Dashboard;