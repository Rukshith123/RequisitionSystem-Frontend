import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ApprovalComments from "../components/ApprovalComments";
import { approveRequisition, rejectRequisition } from "../services/api";
import {
  saveApprovalComment,
  withApprovalComments
} from "../services/approvalComments";
import "../styles/Dashboard.css";
import "../styles/approvals.css";

function Approvals() {
  const [data, setData] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const pageTitle = user?.role === "L3_MANAGER"
    ? "Pending Final Approvals"
    : "Pending BU Approvals";
  const pageDescription = user?.role === "L3_MANAGER"
    ? "Review final-stage requisitions, validate readiness, and keep last-step approvals moving cleanly."
    : "Review incoming business unit requisitions, act quickly on pending requests, and keep approvals on track.";

  useEffect(() => {
    fetchApprovals();
  }, []);

  const getApprovalLevel = () => (user?.role === "L3_MANAGER" ? "L3" : "BU");

  const collectComment = (actionLabel) => {
    const value = window.prompt(`Enter comments to ${actionLabel.toLowerCase()} this requisition:`);
    if (value === null) {
      return null;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      window.alert("Comments are required for this action.");
      return "";
    }

    return trimmedValue;
  };

  const fetchApprovals = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const res = await fetch(
        `http://localhost:5291/api/approvals/pending?role=${user.role}`
      );

      const result = await res.json();
      setData(withApprovalComments(result));

    } catch (error) {
      console.error(error);
    }
  };

  const handleApprove = async (id) => {
    const confirmAction = window.confirm("Are you sure you want to approve this request?");
    if (!confirmAction) return;

    const comments = collectComment("Approve");
    if (comments === null || comments === "") return;

    const user = JSON.parse(localStorage.getItem("user"));

    setLoadingId(id);

    const result = await approveRequisition(id, user.id, comments);

    saveApprovalComment({
      requisitionId: id,
      approverId: user.id,
      approverName: user.username,
      approverRole: user.role,
      approvalLevel: getApprovalLevel(),
      status: "Approved",
      comments,
      actionDate: result?.actionDate || new Date().toISOString()
    });

    setLoadingId(null);

    setMessage("✅ Request approved successfully");

    fetchApprovals();

    setTimeout(() => setMessage(""), 3000);
  };

  const handleReject = async (id) => {
    const confirmAction = window.confirm("Are you sure you want to reject this request?");
    if (!confirmAction) return;

    const comments = collectComment("Reject");
    if (comments === null || comments === "") return;

    const user = JSON.parse(localStorage.getItem("user"));

    setLoadingId(id);

    const result = await rejectRequisition(id, user.id, comments);

    saveApprovalComment({
      requisitionId: id,
      approverId: user.id,
      approverName: user.username,
      approverRole: user.role,
      approvalLevel: getApprovalLevel(),
      status: "Rejected",
      comments,
      actionDate: result?.actionDate || new Date().toISOString()
    });

    setLoadingId(null);

    setMessage("❌ Request rejected");

    fetchApprovals();

    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>
      </section>

      {message && <p className="request-banner">{message}</p>}

      {data.length === 0 ? (
        <div className="request-empty">No requests to approve</div>
      ) : (
        <div className="request-list">
          {data.map((item) => (
            <article className="approval-card request-card" key={item.id}>
              <div className="request-card-header">
                <h3 className="approval-title">{item.title || "Untitled requisition"}</h3>
                <span className={`status-badge status-${(item.status || "unknown").toLowerCase()}`}>
                  {item.status || "Unknown"}
                </span>
              </div>

              <div className="request-detail-grid">
                <div className="request-detail-item">
                  <p className="request-detail-label">Department</p>
                  <p className="request-detail-value">{item.department || "-"}</p>
                </div>
                <div className="request-detail-item">
                  <p className="request-detail-label">Skillset</p>
                  <p className="request-detail-value">{item.skillset || "-"}</p>
                </div>
                <div className="request-detail-item">
                  <p className="request-detail-label">Experience</p>
                  <p className="request-detail-value">{item.experienceLevel || "-"}</p>
                </div>
                <div className="request-detail-item">
                  <p className="request-detail-label">Positions</p>
                  <p className="request-detail-value">{item.numberOfPositions ?? "-"}</p>
                </div>
              </div>

              <ApprovalComments comments={item.approvalComments} />

              <div className="approval-actions">
                <button
                  className="approval-action-button approval-action-approve"
                  onClick={() => handleApprove(item.id)}
                  disabled={loadingId === item.id}
                >
                  {loadingId === item.id ? "Processing..." : "Approve"}
                </button>

                <button
                  className="approval-action-button approval-action-reject"
                  onClick={() => handleReject(item.id)}
                  disabled={loadingId === item.id}
                >
                  {loadingId === item.id ? "Processing..." : "Reject"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}

export default Approvals;