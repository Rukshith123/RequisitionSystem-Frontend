import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import JDViewerModal from "../components/JDViewerModal";
import RequisitionInlineDetails from "../components/RequisitionInlineDetails";
import {
  closeRequisition,
  getApprovedRequisitions,
  getMyApprovals,
  getRequisitionById
} from "../services/api";
import {
  syncApprovalComments,
  withApprovalComments
} from "../services/approvalComments";
import {
  isApprovedStatus,
  isFinalApprovalLevel,
  normalizeApprovalLevel,
  sortByLatestRequisition
} from "../services/approvalHelpers";
import { formatStatus } from "../utils";
import "../styles/Dashboard.css";
import "../styles/approvals.css";

function ApprovedRequests() {
  const [data, setData] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedLoadingId, setExpandedLoadingId] = useState(null);
  const [expandedError, setExpandedError] = useState("");
  const [jdModalRequisition, setJdModalRequisition] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const pageTitle = user.role === "Recruiter"
    ? "Approved Requisitions"
    : user.role === "BA_MANAGER"
      ? "Final Approved Requests"
      : "BU Approved Requests";
  const pageDescription = user.role === "Recruiter"
    ? "Review approved requisitions that are ready for hiring and close fulfilled positions when recruitment is complete."
    : user.role === "BA_MANAGER"
      ? "Track final approvals you have completed and keep visibility on requisitions that passed the last review stage."
      : "Review business unit approvals you have completed and follow requisitions that moved past BU review.";

  const getStatusLabel = (status) => {
    if (status === "L3Approved") {
      return "BAApproved";
    }

    return status || "Unknown";
  };

  const getBaReviewBadge = (status) => {
    const normalizedStatus = status === "L3Approved" ? "BAApproved" : status;

    if (normalizedStatus === "BAApproved" || normalizedStatus === "Closed") {
      return {
        label: "BA Approved",
        background: "#dcfce7",
        color: "#15803d"
      };
    }

    if (normalizedStatus === "Rejected" || normalizedStatus === "BARejected") {
      return {
        label: "BA Rejected",
        background: "#fee2e2",
        color: "#b91c1c"
      };
    }

    if (normalizedStatus === "OnHold" || normalizedStatus === "On Hold" || normalizedStatus === "BAOnHold") {
      return {
        label: "BA On Hold",
        background: "#fff7ed",
        color: "#c2410c"
      };
    }

    return {
      label: "BA Pending",
      background: "#f1f5f9",
      color: "#64748b"
    };
  };

  const badgeBaseStyle = {
    fontSize: "11px",
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: "999px"
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    try {
      // 🔥 RECRUITER FLOW (clean)
      if (user.role === "Recruiter") {
        const result = await getApprovedRequisitions();

        setData(withApprovalComments(sortByLatestRequisition(result || [])));
        return;
      }

      // 🔵 BU & 🟣 L3 FLOW
      const approvals = await getMyApprovals(user.id);

      const filtered = approvals.filter((item) => {
        if (user.role === "BU_MANAGER") {
          return isApprovedStatus(item.status) && normalizeApprovalLevel(item.approvalLevel) === "BU";
        }

        if (user.role === "BA_MANAGER") {
          return isApprovedStatus(item.status) && isFinalApprovalLevel(item.approvalLevel);
        }

        return false;
      });

      const sortedFiltered = sortByLatestRequisition(filtered);

      syncApprovalComments(
        sortedFiltered.map((item) => ({
          requisitionId: item.requisitionId,
          approverId: item.approverId,
          approverName: user.username,
          approverRole: user.role,
          approvalLevel: normalizeApprovalLevel(item.approvalLevel),
          status: item.status,
          comments: item.comments,
          actionDate: item.actionDate
        }))
      );

      const detailed = await Promise.all(
        sortedFiltered.map(async (item) => {
          const req = await getRequisitionById(item.requisitionId);

          return {
            ...req,
            approvalStatus: item.status,
            actionDate: item.actionDate
          };
        })
      );

      // Deduplicate by requisitionId — keep only the latest entry per requisition
      const deduped = Object.values(
        detailed.reduce((acc, item) => {
          const existing = acc[item.id];
          if (!existing || new Date(item.actionDate) > new Date(existing.actionDate)) {
            acc[item.id] = item;
          }
          return acc;
        }, {})
      );

      setData(withApprovalComments(sortByLatestRequisition(deduped)));

    } catch (error) {
      console.error(error);
    }
  };

  // 🔥 CLOSE FUNCTION
  const handleClose = async (id) => {
    const confirmAction = window.confirm("Close this requisition?");
    if (!confirmAction) return;

    setLoadingId(id);

    await closeRequisition(id);

    setLoadingId(null);

    fetchApproved();
  };

  const handleToggleView = async (item) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      setExpandedError("");
      return;
    }

    setExpandedId(item.id);
    setExpandedError("");

    if (expandedDetails[item.id]) {
      return;
    }

    setExpandedLoadingId(item.id);

    try {
      const details = await getRequisitionById(item.id);
      setExpandedDetails((previous) => ({
        ...previous,
        [item.id]: {
          ...details,
          approvalComments: item.approvalComments || []
        }
      }));
    } catch (error) {
      setExpandedError(error.message || "Unable to load full requisition details.");
    } finally {
      setExpandedLoadingId(null);
    }
  };

  return (
    <Layout>
      <section className="dashboard-intro">
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>
      </section>

      {data.length === 0 ? (
        <div className="request-empty">No approved requests</div>
      ) : (
        <div className="request-list">
          {data.map((item) => {
            const statusValue = getStatusLabel(item.status || item.approvalStatus);
            const baBadge = getBaReviewBadge(statusValue);
            const isExpanded = expandedId === item.id;
            const details = expandedDetails[item.id] || item;

            return (
              <article key={item.id} className="approval-summary-card">
                <div className="approval-summary-main">
                  <div>
                    <h3 className="approval-summary-title">{item.title || "Untitled requisition"}</h3>
                    <p className="approval-summary-meta">
                      Req #{item.id} | {item.department || "-"}
                    </p>
                  </div>
                  {user.role === "Recruiter" ? (
                    <span className={`status-badge status-${(item.status || item.approvalStatus || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                      {formatStatus(item.status || item.approvalStatus) || "Unknown"}
                    </span>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ ...badgeBaseStyle, background: "#dcfce7", color: "#15803d" }}>
                        BU Approved
                      </span>
                      <span
                        style={{
                          ...badgeBaseStyle,
                          background: baBadge.background,
                          color: baBadge.color
                        }}
                      >
                        {baBadge.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="approval-summary-actions">
                  <button
                    type="button"
                    className="approval-view-button"
                    onClick={() => handleToggleView(item)}
                  >
                    {isExpanded ? "Hide" : "View"}
                  </button>
                </div>

                {isExpanded && (
                  <RequisitionInlineDetails
                    loading={expandedLoadingId === item.id}
                    error={expandedError}
                    requisition={details}
                    comments={item.approvalComments}
                    onOpenJd={() => setJdModalRequisition(details)}
                    actions={user.role === "Recruiter" && item.status === "BAApproved" ? (
                      <button
                        className="approval-action-button approval-action-close"
                        onClick={() => handleClose(item.id)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id ? "Closing..." : "Close Requisition"}
                      </button>
                    ) : null}
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

export default ApprovedRequests;