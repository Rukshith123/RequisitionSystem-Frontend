import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import "../../styles/Dashboard.css";

function RecruiterDashboard() {
  const [stats, setStats] = useState({
  approved: 0,
  closed: 0
});
  const [history, setHistory] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res1 = await fetch(
        "http://localhost:5291/api/recruiter/requisitions"
      );
      const approved = await res1.json();

      const res2 = await fetch(
        "http://localhost:5291/api/recruiter/requisitions/closed"
      );
      const closedData = await res2.json();

      const approvedHistory = approved.map((item) => ({
        ...item,
        historyStatus: item.status || "Approved"
      }));
      const closedHistory = (closedData.requisitions || []).map((item) => ({
        ...item,
        historyStatus: item.status || "Closed"
      }));

      const combinedHistory = [...approvedHistory, ...closedHistory]
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        .slice(0, 6);

      setStats({
        approved: approved.length,
        closed: closedData.totalClosed
      });
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
          <h2 className="stat-value">{stats.approved}</h2>
          <p className="stat-subtext">Ready for hiring</p>
        </div>
        <div
          className="stat-card stat-closed"
          onClick={() => navigate("/closed")}
        >
          <p className="stat-title">CLOSED REQUESTS</p>
          <h2 className="stat-value">{stats.closed}</h2>
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
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={`${item.historyStatus}-${item.id}`}>
                    <td
                      className="req-id"
                      onClick={() => navigate(`/requisition/${item.id}`)}
                    >
                      {item.title || "Untitled requisition"}
                    </td>
                    <td>{item.id}</td>
                    <td>{item.department || "-"}</td>
                    <td>{item.skillset || "-"}</td>
                    <td>
                      <span className={`status-badge status-${(item.historyStatus || "").toLowerCase()}`}>
                        {item.historyStatus || "Unknown"}
                      </span>
                    </td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
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