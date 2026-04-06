import { useEffect, useState } from "react";
import ApprovalComments from "../components/ApprovalComments";
import { useLocation } from "react-router-dom";
import {
  cancelRequisition,
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
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

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

  const getBuStatus = (reqStatus) => {
    if (["BUApproved", "BAApproved", "Closed"].includes(reqStatus)) return "Approved";
    if (reqStatus === "Rejected") return "Rejected";
    if (reqStatus === "OnHold" || reqStatus === "On Hold") return "On Hold";
    return "Pending";
  };

  const getBaStatus = (reqStatus) => {
    if (["BAApproved", "Closed"].includes(reqStatus)) return "Approved";
    if (reqStatus === "Rejected") return "Rejected";
    if (reqStatus === "OnHold" || reqStatus === "On Hold") return "On Hold";
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
    setIsCancelling(false);
  };

  const getApprovalHistoryMessage = (status) => {
    if (status === "Pending") {
      return "No approvals yet. This requisition has not been reviewed.";
    }

    if (status === "BUApproved") {
      return "⚠️ BU Manager has already approved this. Cancelling will withdraw that approval.";
    }

    if (status === "BAApproved") {
      return "⚠️ Both BU Manager and BA Manager have approved this. Are you sure?";
    }

    return "Approval status unavailable for this requisition.";
  };

  const handleCancelConfirm = async () => {
    if (!selectedRequisition) {
      return;
    }

    setIsCancelling(true);
    setModalError("");

    try {
      const result = await cancelRequisition(selectedRequisition.id);
      const cancelledRecord = {
        ...selectedRequisition,
        ...result,
        status: "Cancelled"
      };

      setRequisitions((previousItems) => previousItems.filter((item) => item.id !== selectedRequisition.id));
      setCancelledRequisitions((previousItems) => [cancelledRecord, ...previousItems]);

      closeCancelModal();
      showToast("Requisition cancelled successfully");
    } catch (error) {
      setModalError(error.message || "Unable to cancel requisition.");
      setIsCancelling(false);
    }
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

      const scopedActiveData = filterRequisitionsForCurrentUser(activeData, user);
      const scopedCancelledData = filterRequisitionsForCurrentUser(cancelledData, user);

      let filteredData = scopedActiveData;

      // ✅ Updated filtering (important for new stats)
      if (statusFilter) {
        filteredData = scopedActiveData.filter((item) => {
          if (statusFilter === "OnHold") {
            return item.status === "OnHold" || item.status === "On Hold";
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
            const buStatus = getBuStatus(req.status);
            const baStatus = getBaStatus(req.status);

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
                    {formatStatus(req.status) || "Unknown"}
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
                          {req.status === "Pending" || req.status === "BUApproved" || req.status === "OnHold" ? (
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
                              <p style={{ margin: 0, fontWeight: 600 }}>CU Manager — Submitted — {fmt(req.createdAt)}</p>
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
                                BU Manager — {buStatus === "Approved" ? "BU Approved" : buStatus} — {buStatus === "Pending" ? "Pending" : fmt(req.updatedAt)}
                              </p>
                            </div>
                          </div>

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
                                BA Manager — {baStatus === "Approved" ? "BA Approved" : baStatus} — {baStatus === "Pending" ? "Pending" : fmt(req.updatedAt)}
                              </p>
                            </div>
                          </div>
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
              cancelledRequisitions.map((item) => (
                <article key={item.id} className="request-card my-req-card cancelled-card">
                  <button
                    type="button"
                    className="cancelled-delete-x"
                    onClick={() => openPermanentDeletePopup(item)}
                    aria-label="Delete permanently"
                  >
                    ✕
                  </button>

                  <div className="request-card-header">
                    <div>
                      <h3 className="approval-title">{getDisplayTitle(item)}</h3>
                      <p className="my-req-subtitle">Requisition ID #{item.id}</p>
                    </div>
                    <span className="status-badge status-cancelled">Cancelled</span>
                  </div>

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
                </article>
              ))
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
                disabled={isCancelling}
              >
                Go Back
              </button>
              <button
                type="button"
                className="cancel-primary-button"
                onClick={handleCancelConfirm}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel It"}
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