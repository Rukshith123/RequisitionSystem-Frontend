import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { getApprovedRequisitions, getClosedRequisitions } from "../../services/api";
import { formatStatus } from "../../utils";
import "../../styles/Dashboard.css";

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
}) : "—";

function RecruiterDashboard() {
  const [approvedCount, setApprovedCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [history, setHistory] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const approvedData = await getApprovedRequisitions();
      console.log("Recruiter approved requisitions response:", approvedData);
      setApprovedCount(Array.isArray(approvedData) ? approvedData.length : 0);

      const closedData = await getClosedRequisitions();
      setClosedCount(closedData.totalClosed || closedData.requisitions?.length || 0);

      const combinedHistory = [
        ...(approvedData || []),
        ...(closedData.requisitions || [])
      ]
        .sort((left, right) => {
          const leftDate = new Date(left.updatedAt || left.createdAt || 0).getTime();
          const rightDate = new Date(right.updatedAt || right.createdAt || 0).getTime();
          return rightDate - leftDate;
        })
        .slice(0, 5);

      setHistory(combinedHistory);

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>Recruiter View</h1>
        <p>
          Keep track of approved positions, monitor closures, and move quickly
          from requisition approval to successful hiring.
        </p>
      </section>

      {/* Stats */}
      <div className="stats-container">

        <div
          className="stat-card stat-l3"
          onClick={() => navigate("/approved")}
        >
          <p className="stat-title">APPROVED REQUESTS</p>
          <h2 className="stat-value">{approvedCount}</h2>
          <p className="stat-subtext">Ready for hiring</p>
        </div>
        <div
          className="stat-card stat-closed"
          onClick={() => navigate("/closed")}
        >
          <p className="stat-title">CLOSED REQUESTS</p>
          <h2 className="stat-value">{closedCount}</h2>
          <p className="stat-subtext">Completed requisitions</p>
        </div>

      </div>

      {/* Actions */}
      <div className="dashboard-actions dashboard-actions-center dashboard-actions-cu">

        <div
          className="card action-button"
          onClick={() => navigate("/approved")}
        >
          View Approved Requisitions
        </div>

      </div>

      <section className="active-requisitions">
        <div className="section-header">
          <h3>Recruitment History</h3>
          <p>Latest approved and closed requisitions</p>
        </div>

        {history.length === 0 ? (
          <div className="dashboard-history-empty">No recruitment history available yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="requisition-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Skillset</th>
                  <th>Hire By Date</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={`${item.status || "status"}-${item.id}`}>
                    <td
                      className="req-id"
                      onClick={() => navigate(`/requisition/${item.id}`, { state: { fromDashboard: "/dashboard" } })}
                    >
                      {item.title || "Untitled requisition"}
                    </td>
                    <td>{item.id}</td>
                    <td>{item.department || "-"}</td>
                    <td>{item.skillset || "-"}</td>
                    <td>{fmt(item.hireByDate)}</td>
                    <td>
                      <span className={`status-badge status-${(item.status || "").toLowerCase().replace(/\s+/g, "")}`}>
                        {formatStatus(item.status) || "Unknown"}
                      </span>
                    </td>
                    <td>{fmt(item.createdAt)}</td>
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

export default RecruiterDashboard;