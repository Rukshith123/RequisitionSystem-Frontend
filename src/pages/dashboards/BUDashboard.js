import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMyApprovals, getPendingApprovals, getRequisitionById } from "../../services/api";
import JDViewerModal from "../../components/JDViewerModal";
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

function BUDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
    });
  const [history, setHistory] = useState([]);
  const [selectedJDRequisition, setSelectedJDRequisition] = useState(null);
  useEffect(() => {
    fetchStats();
    }, []);

    const getBuDepartment = (user) => {
      if (user?.department) {
        return user.department;
      }

      if (user?.username === "madan") {
        return "Nexer EA";
      }

      if (user?.username === "deepa") {
        return "Nexer Pvt Ltd";
      }

      return "";
    };

    const fetchStats = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    // ✅ 1. Get pending approvals (for BU)
    const pendingData = await getPendingApprovals(user.role);
    console.log("BU pending requisitions response:", pendingData);

    const department = getBuDepartment(user);
    const filteredPendingData = (pendingData || []).filter((req) => {
      if (!department) {
        return true;
      }

      return req.creator?.department === department || req.creatorDepartment === department;
    });
    const pendingCount = filteredPendingData.length;

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

export default BUDashboard;