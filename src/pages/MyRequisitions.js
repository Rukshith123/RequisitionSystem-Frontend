import { useEffect, useState } from "react";
import ApprovalComments from "../components/ApprovalComments";
import { useLocation } from "react-router-dom";
import {
  deleteRequisitionPermanently,
  getCancelledRequisitions,
  getMyRequisitions,
  getRequisitionById
} from "../services/api";
import { withApprovalComments } from "../services/approvalComments";
import { filterRequisitionsForCurrentUser } from "../services/requisitionAccess";
import { formatStatus } from "../utils";
import Layout from "../components/Layout";
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

function MyRequisitions() {
  const [requisitions, setRequisitions] = useState([]);
  const [cancelledRequisitions, setCancelledRequisitions] = useState([]);
  const [isCancelledExpanded, setIsCancelledExpanded] = useState(true);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [isLoadingLatestForModal, setIsLoadingLatestForModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedCancelledId, setExpandedCancelledId] = useState(null);

  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get("status");
  const titleByStatus = {
    Pending: "Pending Requisitions",
    BUApproved: "BU Approved Requisitions",
    BAApproved: "Final Approved Requisitions",
    Closed: "Closed Requisitions",
    Rejected: "Rejected Requisitions"
  };
  const descriptionByStatus = {
    Pending: "Review active requisitions awaiting approval and keep new hiring requests moving forward.",
    BUApproved: "Track requisitions that have passed business unit review and are ready for final approval.",
    BAApproved: "Monitor requisitions that are fully approved and ready for the next hiring steps.",
    Closed: "Review completed requisitions and keep visibility on hiring requests that have been closed.",
    Rejected: "See requisitions that were rejected and keep a clear record of declined hiring requests."
  };
  const pageTitle = titleByStatus[statusFilter] || "My Requisitions";
  const pageDescription = descriptionByStatus[statusFilter] || "Manage and monitor your requisitions with clear status tracking, clean details, and quick access to each request.";

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const getDisplayTitle = (item) => {
    return item.title || item.requisitionTitle || item.jobTitle || item.position || item.postTitle || "Untitled requisition";
  };

  const getTimelineDotColor = (status) => {
    if (status === "Approved") return "#16a34a";
    if (status === "Rejected") return "#dc2626";
    if (status === "On Hold") return "#ea580c";
    return "#94a3b8";
  };

  const getRejectionLevel = (req) => {
    if (req.status !== "Rejected") return null;
    const comments = req.approvalComments || [];
    const rejectionComment = comments.find(
      (c) => (c.status || "").toLowerCase() === "rejected"
    );
    if (!rejectionComment) return null;
    const level = (rejectionComment.approvalLevel || "").toUpperCase();
    if (level === "BA") return "BA";
    if (level === "BU") return "BU";
    return null;
  };

  const getBuStatus = (reqStatus, rejectBy, holdBy) => {
    if (["BUApproved", "BAApproved", "Closed"].includes(reqStatus)) return "Approved";
    if (reqStatus === "BURejected" || (reqStatus === "Rejected" && rejectBy === "BU")) return "Rejected";
    if (reqStatus === "BARejected" || (reqStatus === "Rejected" && rejectBy === "BA")) return "Approved";
    if (reqStatus === "BUOnHold" || (reqStatus === "OnHold" && holdBy === "BU")) return "On Hold";
    if (reqStatus === "BAOnHold" || (reqStatus === "OnHold" && holdBy === "BA")) return "Approved";
    if (reqStatus === "On Hold") return "On Hold";
    return "Pending";
  };

  const getBaStatus = (reqStatus, rejectBy, holdBy) => {
    if (["BAApproved", "Closed"].includes(reqStatus)) return "Approved";
    if (reqStatus === "BARejected" || (reqStatus === "Rejected" && rejectBy === "BA")) return "Rejected";
    if (reqStatus === "BURejected" || (reqStatus === "Rejected" && rejectBy === "BU")) return "Pending";
    if (reqStatus === "BAOnHold" || (reqStatus === "OnHold" && holdBy === "BA")) return "On Hold";
    if (reqStatus === "BUOnHold" || (reqStatus === "OnHold" && holdBy === "BU")) return "Pending";
    if (reqStatus === "On Hold") return "On Hold";
    return "Pending";
  };

  const openCancelModal = async (req) => {
    setModalError("");
    setIsLoadingLatestForModal(true);

    try {
      const latestRecord = await getRequisitionById(req.id);

      if (!latestRecord) {
        throw new Error("Unable to find latest requisition details.");
      }

      setSelectedRequisition(latestRecord);
    } catch (error) {
      // Keep cancel available even if latest refresh fails.
      setSelectedRequisition(req);
      showToast(error.message || "Using current requisition data. Please proceed carefully.");
    } finally {
      setIsLoadingLatestForModal(false);
    }
  };

  const closeCancelModal = () => {
    setSelectedRequisition(null);
    setModalError("");
  };

  const getApprovalHistoryMessage = (status) => {
    if (status === "Pending") {
      return "No approvals yet. This requisition has not been reviewed.";
    }

    if (status === "BUApproved") {
      return "❌ This requisition has been approved by BU Manager and cannot be cancelled.";
    }

    if (status === "BAApproved") {
      return "❌ This requisition has been fully approved and cannot be cancelled.";
    }

    if (status === "BUOnHold" || status === "OnHold") {
      return "⏸ This requisition is currently on hold by the BU Manager. You cannot cancel it while it is under review.";
    }

    if (status === "BAOnHold") {
      return "⏸ This requisition is currently on hold by the BA Manager. You cannot cancel it while it is under review.";
    }

    return "Approval status unavailable for this requisition.";
  };

  const getCancelledDate = (item) => {
    return item.cancelledDate || item.cancellationDate || item.updatedAt || item.modifiedAt || item.actionDate || "";
  };

  const openPermanentDeletePopup = (item) => {
    setDeleteTarget(item);
    setDeleteError("");
  };

  const closePermanentDeletePopup = () => {
    setDeleteTarget(null);
    setDeleteError("");
    setIsDeletingPermanently(false);
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeletingPermanently(true);
    setDeleteError("");

    try {
      await deleteRequisitionPermanently(deleteTarget.id);
      setCancelledRequisitions((items) => items.filter((item) => item.id !== deleteTarget.id));
      setRequisitions((items) => items.filter((item) => item.id !== deleteTarget.id));
      closePermanentDeletePopup();
      showToast("Permanently deleted");
    } catch (error) {
      setDeleteError(error.message || "Unable to permanently delete requisition.");
      setIsDeletingPermanently(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const [activeData, cancelledData] = await Promise.all([
        getMyRequisitions(user.username),
        getCancelledRequisitions()
      ]);

      const scopedActiveData = filterRequisitionsForCurrentUser(activeData, user)
        .filter((item) => item.status !== "Cancelled");
      const scopedCancelledData = filterRequisitionsForCurrentUser(cancelledData, user);

      let filteredData = scopedActiveData;

      // ✅ Updated filtering (important for new stats)
      if (statusFilter) {
        filteredData = scopedActiveData.filter((item) => {
          if (statusFilter === "OnHold") {
            return item.status === "OnHold" || item.status === "On Hold" || item.status === "BUOnHold" || item.status === "BAOnHold";
          }

          if (statusFilter === "Rejected") {
            return item.status === "Rejected" || item.status === "BURejected" || item.status === "BARejected";
          }

          return item.status === statusFilter;
        });
      }

      const sortedData = [...filteredData].sort((a, b) => b.id - a.id);
      const sortedCancelled = [...scopedCancelledData].sort(
        (a, b) => new Date(getCancelledDate(b)).getTime() - new Date(getCancelledDate(a)).getTime()
      );

      setRequisitions(withApprovalComments(sortedData));
      setCancelledRequisitions(sortedCancelled);
    } catch (error) {
      console.error("Error fetching requisitions:", error);
    }
  };

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>
      </section>

      {toastMessage && <p className="request-banner request-banner-success">{toastMessage}</p>}

      {isLoadingLatestForModal && <p className="request-banner">Loading latest requisition details...</p>}

      {requisitions.length === 0 ? (
        <div className="request-empty">No requisitions found</div>
      ) : (
        <div className="request-list">
          {requisitions.map((req) => {
            const isExpanded = expandedId === req.id;
            const resolvedRejectBy =
              req.status === "BURejected" ? "BU" :
              req.status === "BARejected" ? "BA" :
              req.status === "Rejected" ? getRejectionLevel(req) : null;
            const resolvedHoldBy =
              req.status === "BUOnHold" ? "BU" :
              req.status === "BAOnHold" ? "BA" : null;
            const buStatus = getBuStatus(req.status, resolvedRejectBy, resolvedHoldBy);
            const baStatus = getBaStatus(req.status, resolvedRejectBy, resolvedHoldBy);

            return (
              <article key={req.id} className="request-card my-req-card">
                <button
                  type="button"
                  onClick={() => setExpandedId((current) => (current === req.id ? null : req.id))}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "auto 2fr 1.3fr 1.4fr auto",
                    gap: "12px",
                    alignItems: "center",
                    border: "none",
                    background: "transparent",
                    padding: "8px 0",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <span className={`status-badge status-${(req.status || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                    {req.status === "Rejected"
                      ? (getRejectionLevel(req) ? `${getRejectionLevel(req)} Rejected` : "Rejected")
                      : (formatStatus(req.status) || "Unknown")}
                  </span>
                  <span style={{ fontWeight: 600 }}>{getDisplayTitle(req)}</span>
                  <span style={{ color: "#475569" }}>{req.department || "-"}</span>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>{fmt(req.createdAt)}</span>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>{isExpanded ? "▼" : "▶"}</span>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "10px", paddingTop: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
                      <div>
                        <div className="request-detail-grid">
                          <div className="request-detail-item">
                            <p className="request-detail-label">Title</p>
                            <p className="request-detail-value">{getDisplayTitle(req)}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Department</p>
                            <p className="request-detail-value">{req.department || "-"}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Skillset</p>
                            <p className="request-detail-value">{req.skillset || "-"}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Experience</p>
                            <p className="request-detail-value">{req.experienceLevel || "-"}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Positions</p>
                            <p className="request-detail-value">{req.numberOfPositions ?? "-"}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Location</p>
                            <p className="request-detail-value">{req.location || "-"}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Hire By Date</p>
                            <p className="request-detail-value">{fmt(req.hireByDate)}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Customer Name</p>
                            <p className="request-detail-value">{req.customerName || "-"}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Comments</p>
                            <p className="request-detail-value">{req.comments || "-"}</p>
                          </div>
                          <div className="request-detail-item">
                            <p className="request-detail-label">Submitted On</p>
                            <p className="request-detail-value">{fmt(req.createdAt)}</p>
                          </div>
                        </div>

                        <ApprovalComments comments={req.approvalComments} />

                        <div className="my-req-actions" style={{ marginTop: "12px" }}>
                          {req.status !== "Cancelled" && req.status !== "Closed" && req.status !== "BURejected" && req.status !== "BARejected" && req.status !== "Rejected" ? (
                            <button
                              className="my-req-delete-button"
                              onClick={() => openCancelModal(req)}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
                        <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#1e293b" }}>Approval Status</h4>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "999px", background: "#16a34a", marginTop: "5px", flexShrink: 0 }} />
                            <div>
                              <p style={{ margin: 0, fontWeight: 600 }}>CU Manager — Submitted</p>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <span
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "999px",
                                background: getTimelineDotColor(buStatus),
                                marginTop: "5px",
                                flexShrink: 0
                              }}
                            />
                            <div>
                              <p style={{ margin: 0, fontWeight: 600 }}>
                                BU Manager — {buStatus === "Approved" ? "BU Approved" : buStatus}
                              </p>
                            </div>
                          </div>

                          {resolvedRejectBy !== "BU" && req.status !== "BURejected" && req.status !== "BUOnHold" && resolvedHoldBy !== "BU" && (
                            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                              <span
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "999px",
                                  background: getTimelineDotColor(baStatus),
                                  marginTop: "5px",
                                  flexShrink: 0
                                }}
                              />
                              <div>
                                <p style={{ margin: 0, fontWeight: 600 }}>
                                  BA Manager — {baStatus === "Approved" ? "BA Approved" : baStatus}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <section className="cancelled-section">
        <button
          type="button"
          className="cancelled-section-toggle"
          onClick={() => setIsCancelledExpanded((value) => !value)}
        >
          <span>🗃️ Cancelled Requisitions</span>
          <span>{isCancelledExpanded ? "Hide" : "Show"}</span>
        </button>

        {isCancelledExpanded && (
          <div className="cancelled-grid">
            {cancelledRequisitions.length === 0 ? (
              <div className="request-empty">No cancelled requisitions</div>
            ) : (
              cancelledRequisitions.map((item) => {
                const isCancelledItemExpanded = expandedCancelledId === item.id;
                return (
                <article key={item.id} className="request-card my-req-card cancelled-card" style={{ cursor: "pointer" }} onClick={() => setExpandedCancelledId((curr) => (curr === item.id ? null : item.id))}>
                  <div
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "auto 2fr 1.3fr 1.4fr",
                      gap: "12px",
                      alignItems: "center",
                      padding: "8px 0",
                      paddingRight: "90px"
                    }}
                  >
                    <span className="status-badge status-cancelled">Cancelled</span>
                    <span style={{ fontWeight: 600 }}>{getDisplayTitle(item)}</span>
                    <span style={{ color: "#475569" }}>{item.department || "-"}</span>
                    <span style={{ color: "#64748b", fontSize: "13px" }}>{fmt(item.createdAt)}</span>
                  </div>
                  <button
                    type="button"
                    className="cancelled-delete-x"
                    onClick={(e) => { e.stopPropagation(); openPermanentDeletePopup(item); }}
                    aria-label="Delete permanently"
                  >
                    Delete
                  </button>

                  {isCancelledItemExpanded && (
                    <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "10px", paddingTop: "14px" }}>
                      <div className="request-detail-grid">
                        <div className="request-detail-item">
                          <p className="request-detail-label">Department</p>
                          <p className="request-detail-value">{item.department || "-"}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Skillset</p>
                          <p className="request-detail-value">{item.skillSet || item.skillset || "-"}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Experience</p>
                          <p className="request-detail-value">{item.experienceLevel || "-"}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Positions</p>
                          <p className="request-detail-value">{item.numberOfPositions ?? "-"}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Location</p>
                          <p className="request-detail-value">{item.location || "-"}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Hire By Date</p>
                          <p className="request-detail-value">{fmt(item.hireByDate)}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Customer Name</p>
                          <p className="request-detail-value">{item.customerName || "-"}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Comments</p>
                          <p className="request-detail-value">{item.comments || "-"}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Date Cancelled</p>
                          <p className="request-detail-value">{fmt(getCancelledDate(item))}</p>
                        </div>
                        <div className="request-detail-item">
                          <p className="request-detail-label">Submitted On</p>
                          <p className="request-detail-value">{fmt(item.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
                );
              })
            )}
          </div>
        )}
      </section>

      {selectedRequisition && (
        <div className="cancel-modal-overlay" role="presentation">
          <div className="cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
            <h3 id="cancel-modal-title">Cancel Requisition?</h3>
            <div className="cancel-modal-body">
              <p>
                <strong>Requisition Title:</strong> {getDisplayTitle(selectedRequisition)}
              </p>
              <p>
                <strong>Current Status:</strong>{" "}
                <span className={`status-badge status-${(selectedRequisition.status || "unknown").toLowerCase()}`}>
                  {formatStatus(selectedRequisition.status) || "Unknown"}
                </span>
              </p>

              <div className="approval-history-box">
                <p className="approval-history-title">Approval History</p>
                <p className="cancel-warning-message">{getApprovalHistoryMessage(selectedRequisition.status)}</p>
              </div>

              {modalError && <p className="cancel-error-message">{modalError}</p>}
            </div>

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="cancel-secondary-button"
                onClick={closeCancelModal}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="cancel-modal-overlay" role="presentation">
          <div className="cancel-modal cancel-modal-small" role="dialog" aria-modal="true">
            <h3>Delete Permanently?</h3>
            <div className="cancel-modal-body">
              <p>This will permanently delete this requisition from the system. This cannot be undone.</p>
              {deleteError && <p className="cancel-error-message">{deleteError}</p>}
            </div>
            <div className="cancel-modal-actions">
              <button
                type="button"
                className="cancel-secondary-button"
                onClick={closePermanentDeletePopup}
                disabled={isDeletingPermanently}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cancel-primary-button"
                onClick={handlePermanentDelete}
                disabled={isDeletingPermanently}
              >
                {isDeletingPermanently ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default MyRequisitions;