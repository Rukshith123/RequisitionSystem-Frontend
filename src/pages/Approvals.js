import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import JDViewerModal from "../components/JDViewerModal";
import RequisitionInlineDetails from "../components/RequisitionInlineDetails";
import {
  approveOnHoldRequisition,
  approveRequisition,
  getMyApprovals,
  getPendingApprovals,
  getRequisitionById,
  holdRequisition,
  rejectRequisition
} from "../services/api";
import {
  saveApprovalComment,
  withApprovalComments
} from "../services/approvalComments";
import { formatStatus } from "../utils";
import { sortByLatestRequisition } from "../services/approvalHelpers";
import "../styles/Dashboard.css";
import "../styles/approvals.css";

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
}) : "—";

function Approvals() {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedLoadingId, setExpandedLoadingId] = useState(null);
  const [expandedError, setExpandedError] = useState("");
  const [jdModalRequisition, setJdModalRequisition] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const statusFilter = new URLSearchParams(location.search).get("status");
  const isOnHoldView = statusFilter === "OnHold";
  const pageTitle = isOnHoldView
    ? "On Hold Approvals"
    : user?.role === "BA_MANAGER"
      ? "Pending Final Approvals"
      : "Pending BU Approvals";
  const pageDescription = isOnHoldView
    ? "Review requisitions currently on hold and either approve them now or keep them on hold."
    : user?.role === "BA_MANAGER"
      ? "Review final-stage requisitions, validate readiness, and keep last-step approvals moving cleanly."
      : "Review incoming business unit requisitions, act quickly on pending requests, and keep approvals on track.";

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const getApprovalLevel = () => (user?.role === "BA_MANAGER" ? "BA" : "BU");

  const getDisplayTitle = (item) => {
    return item.title || item.requisitionTitle || item.jobTitle || item.position || item.postTitle || "Untitled requisition";
  };

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

      if (isOnHoldView) {
        const approvals = await getMyApprovals(user.id);
        const onHoldApprovals = (approvals || []).filter(
          (item) => item.status === "OnHold" || item.status === "On Hold"
        );
        const detailedOnHold = await Promise.all(
          onHoldApprovals.map(async (item) => {
            const requisitionId = item.requisitionId || item.id;
            const req = await getRequisitionById(requisitionId);

            return {
              ...req,
              id: req.id || requisitionId,
              requisitionId,
              approvalId: item.id,
              status: "OnHold",
              actionDate: item.actionDate,
              approvalComments: item.approvalComments || []
            };
          })
        );

        const sortedOnHold = sortByLatestRequisition(detailedOnHold || []);
        setData(withApprovalComments(sortedOnHold));
        if (expandedId && !sortedOnHold.some((item) => item.id === expandedId)) {
          setExpandedId(null);
          setExpandedError("");
        }

        return;
      }

      const result = await getPendingApprovals(user.role);
      const sorted = sortByLatestRequisition(result || []);
      setData(withApprovalComments(sorted));

      if (expandedId && !sorted.some((item) => item.id === expandedId)) {
        setExpandedId(null);
        setExpandedError("");
      }

    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleView = async (item) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      setExpandedError("");
      setExpandedLoadingId(null);
      return;
    }

    setExpandedId(item.id);
    setExpandedError("");

    if (expandedDetails[item.id]) {
      return;
    }

    setExpandedLoadingId(item.id);

    try {
      const details = await getRequisitionById(item.requisitionId || item.id);
      setExpandedDetails((previous) => ({
        ...previous,
        [item.id]: {
          ...details,
          approvalId: item.approvalId,
          approvalComments: item.approvalComments || []
        }
      }));
    } catch (error) {
      setExpandedError(error.message || "Unable to load full requisition details.");
    } finally {
      setExpandedLoadingId(null);
    }
  };

  const handleViewJd = async (item) => {
    try {
      const details = await getRequisitionById(item.id);
      setJdModalRequisition(details);
    } catch (error) {
      window.alert(error.message || "Unable to load JD.");
    }
  };

  const patchStatusLocally = (id, nextStatus) => {
    setData((previous) => previous.map((entry) => (
      entry.id === id ? { ...entry, status: nextStatus } : entry
    )));

    setExpandedDetails((previous) => {
      if (!previous[id]) {
        return previous;
      }

      return {
        ...previous,
        [id]: {
          ...previous[id],
          status: nextStatus
        }
      };
    });
  };

  const handleApprove = async (item) => {
    const itemId = item.id;
    const requisitionId = item.requisitionId || item.id;
    const confirmAction = window.confirm("Are you sure you want to approve this request?");
    if (!confirmAction) return;

    const approvalComment = window.prompt("Enter comments to approve this requisition:");
    if (approvalComment === null) return;

    const comments = approvalComment.trim() || "Approved";

    const user = JSON.parse(localStorage.getItem("user"));

    setLoadingId(itemId);

    try {
      const result = await approveRequisition(requisitionId, user.id, comments);

      saveApprovalComment({
        requisitionId,
        approverId: user.id,
        approverName: user.username,
        approverRole: user.role,
        approvalLevel: getApprovalLevel(),
        status: "Approved",
        comments,
        actionDate: result?.actionDate || new Date().toISOString()
      });

      patchStatusLocally(itemId, user?.role === "BA_MANAGER" ? "BAApproved" : "BUApproved");
      setMessage("✅ Request approved successfully");

      if (expandedId === itemId) {
        setExpandedId(null);
      }
    } catch (error) {
      setMessage(error.message || "Unable to approve requisition");
    } finally {
      setLoadingId(null);
      setTimeout(() => setMessage(""), 3000);
    }
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

    if (expandedId === id) {
      setExpandedId(null);
    }

    fetchApprovals();

    setTimeout(() => setMessage(""), 3000);
  };

  const handleHold = async (item) => {
    const itemId = item.id;
    const requisitionId = item.requisitionId || item.id;
    const confirmAction = window.confirm("Put this requisition on hold?");
    if (!confirmAction) return;

    const comments = "On Hold";

    const user = JSON.parse(localStorage.getItem("user"));

    setLoadingId(itemId);

    try {
      const result = await holdRequisition(requisitionId, user.id, comments);

      saveApprovalComment({
        requisitionId,
        approverId: user.id,
        approverName: user.username,
        approverRole: user.role,
        approvalLevel: getApprovalLevel(),
        status: "On Hold",
        comments,
        actionDate: result?.actionDate || new Date().toISOString()
      });

      patchStatusLocally(itemId, "OnHold");
      setMessage("⏸ Requisition moved to On Hold");
    } catch (error) {
      setMessage(error.message || "Unable to put requisition on hold");
    } finally {
      setLoadingId(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleUnholdAndApprove = async (item) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const actionId = item.approvalId || item.requisitionId || item.id;

    setLoadingId(item.id);

    try {
      await approveOnHoldRequisition(actionId, parseInt(user.id, 10));
      patchStatusLocally(item.id, user?.role === "BA_MANAGER" ? "BAApproved" : "BUApproved");
      setMessage("✅ On hold requisition approved successfully");
      await fetchApprovals();
    } catch (error) {
      setMessage(error.message || "Unable to approve on hold requisition");
    } finally {
      setLoadingId(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleKeepOnHold = (itemId) => {
    setExpandedId(null);
    setExpandedError("");
    setMessage("Requisition kept on hold");
    setTimeout(() => setMessage(""), 3000);
    setData((previous) => previous.filter((entry) => entry.id !== itemId));
  };

  const handleRejectOnHold = async (item) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const actionId = item.requisitionId || item.id;

    setLoadingId(item.id);

    try {
      await rejectRequisition(actionId, parseInt(user.id, 10), "");
      setMessage("❌ On hold requisition rejected");
      await fetchApprovals();
    } catch (error) {
      setMessage(error.message || "Unable to reject on hold requisition");
    } finally {
      setLoadingId(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>
      </section>

      {message && <p className="request-banner">{message}</p>}

      {data.length === 0 ? (
        <div className="request-empty">{isOnHoldView ? "No on hold requests" : "No requests to approve"}</div>
      ) : (
        <div className="request-list">
          {data.map((item) => {
            const isExpanded = expandedId === item.id;
            const details = expandedDetails[item.id] || item;

            return (
            <article className="approval-summary-card" key={item.id}>
              <div className="approval-summary-main">
                <div>
                  <h3 className="approval-summary-title">{getDisplayTitle(item)}</h3>
                  <p className="approval-summary-meta">
                    Req #{item.id} | {item.department || "-"} | Updated: {fmt(item.updatedAt || item.actionDate)}
                  </p>
                </div>
                <span className={`status-badge status-${(item.status || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                  {formatStatus(item.status) || "Unknown"}
                </span>
              </div>

              <div className="approval-summary-actions">
                <button
                  type="button"
                  className="approval-view-button"
                  onClick={() => handleToggleView(item)}
                >
                  {isExpanded ? "Hide" : "View"}
                </button>
                <button
                  type="button"
                  className="approval-view-button approval-view-button-jd"
                  onClick={() => handleViewJd(item)}
                >
                  View JD
                </button>
              </div>

              {isExpanded && (
                <RequisitionInlineDetails
                  loading={expandedLoadingId === item.id}
                  error={expandedError}
                  requisition={details}
                  comments={item.approvalComments}
                  onOpenJd={() => setJdModalRequisition(details)}
                  actions={isOnHoldView ? (
                    <>
                      <button
                        className="approval-action-button approval-action-approve"
                        onClick={() => handleUnholdAndApprove(item)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id ? "Processing..." : "Unhold & Approve"}
                      </button>

                      <button
                        className="approval-action-button approval-action-hold"
                        onClick={() => handleKeepOnHold(item.id)}
                        disabled={loadingId === item.id}
                      >
                        Keep on Hold
                      </button>

                      <button
                        className="approval-action-button approval-action-reject"
                        onClick={() => handleRejectOnHold(item)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id ? "Processing..." : "Reject"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="approval-action-button approval-action-approve"
                        onClick={() => handleApprove(item)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id ? "Processing..." : "Approve"}
                      </button>

                      <button
                        className="approval-action-button approval-action-hold"
                        onClick={() => handleHold(item)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id ? "Processing..." : "Hold"}
                      </button>

                      <button
                        className="approval-action-button approval-action-reject"
                        onClick={() => handleReject(item.id)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id ? "Processing..." : "Reject"}
                      </button>
                    </>
                  )}
                />
              )}
            </article>
            );
          })}
        </div>
      )}

      {jdModalRequisition && (
        <JDViewerModal
          requisition={jdModalRequisition}
          onClose={() => setJdModalRequisition(null)}
        />
      )}
    </Layout>
  );
}

export default Approvals;