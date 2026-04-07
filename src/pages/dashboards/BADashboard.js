import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyApprovals, getPendingApprovals, getRequisitionById } from "../../services/api";
import JDViewerModal from "../../components/JDViewerModal";
import {
  isApprovedStatus,
  isFinalApprovalLevel,
  isRejectedStatus,
  sortByLatestRequisition
} from "../../services/approvalHelpers";
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

function BADashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    onHold: 0
    });
  const [history, setHistory] = useState([]);
  const [selectedJDRequisition, setSelectedJDRequisition] = useState(null);

  useEffect(() => {
    fetchStats();
    }, []);

    const fetchStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      // Pending (BUApproved)
      const pendingData = await getPendingApprovals(user.role);
      const pendingCount = (pendingData || []).length;

      // My approvals (BA actions)
      const approvals = await getMyApprovals(user.id);

      const baHistory = approvals.filter((item) => isFinalApprovalLevel(item.approvalLevel));
      const approved = baHistory.filter((item) => isApprovedStatus(item.status)).length;
      const rejected = baHistory.filter((item) => isRejectedStatus(item.status)).length;
      const onHold = baHistory.filter((item) => item.status === "OnHold" || item.status === "On Hold").length;

      const detailedHistory = await Promise.all(
        sortByLatestRequisition(baHistory)
          .slice(0, 6)
          .map(async (item) => {
            try {
              const requisition = await getRequisitionById(item.requisitionId);

              return {
                ...item,
                title: requisition.title,
                department: requisition.department,
                hireByDate: requisition.hireByDate,
                jdContent: requisition.JDContent || requisition.jdContent || ""
              };
            } catch (error) {
              return item;
            }
          })
      );

      setHistory(detailedHistory);

      setStats({
        pending: pendingCount,
        approved,
        rejected,
        onHold
      });

    } catch (error) {
      console.error(error);
    }
    };

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>BA Final Approval View</h1>
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

        <div
          className="stat-card stat-hold"
          onClick={() => navigate("/approvals?status=OnHold")}
        >
          <p className="stat-title">ON HOLD</p>
          <h2 className="stat-value">{stats.onHold}</h2>
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
                  <th>Hire By Date</th>
                  <th>Comment</th>
                  <th>Action Date</th>
                  <th>JD</th>
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
                        {formatStatus(item.status) || "Unknown"}
                      </span>
                    </td>
                    <td>{fmt(item.hireByDate)}</td>
                    <td>{item.comments || "-"}</td>
                    <td>{fmt(item.actionDate)}</td>
                    <td>
                      {(item.jdContent || "").trim() ? (
                        <button
                          type="button"
                          className="view-jd-button"
                          onClick={() => setSelectedJDRequisition(item)}
                        >
                          View JD
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedJDRequisition && (
        <JDViewerModal
          requisition={selectedJDRequisition}
          onClose={() => setSelectedJDRequisition(null)}
        />
      )}
    </Layout>
  );
}

export default BADashboard;