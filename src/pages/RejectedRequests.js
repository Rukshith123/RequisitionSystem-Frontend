import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import JDViewerModal from "../components/JDViewerModal";
import RequisitionInlineDetails from "../components/RequisitionInlineDetails";
import { getMyApprovals, getRequisitionById } from "../services/api";
import {
  syncApprovalComments,
  withApprovalComments
} from "../services/approvalComments";
import {
  isRejectedStatus,
  isFinalApprovalLevel,
  normalizeApprovalLevel,
  sortByLatestRequisition
} from "../services/approvalHelpers";
import { formatStatus } from "../utils";
import "../styles/Dashboard.css";
import "../styles/approvals.css";

function RejectedRequests() {
  const [data, setData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedLoadingId, setExpandedLoadingId] = useState(null);
  const [expandedError, setExpandedError] = useState("");
  const [jdModalRequisition, setJdModalRequisition] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const pageTitle = user?.role === "BA_MANAGER"
    ? "BA Manager Rejected Requests"
    : "BU Rejected Requests";
  const pageDescription = user?.role === "BA_MANAGER"
    ? "Review requisitions rejected at the final approval stage and keep clarity on the decisions made."
    : "Review requisitions rejected during business unit approval and track what was declined before final review.";

  useEffect(() => {
    fetchRejected();
  }, []);

  const fetchRejected = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const approvals = await getMyApprovals(user.id);
      const filtered = approvals.filter((item) => {
        if (!isRejectedStatus(item.status)) {
          return false;
        }

        if (user.role === "BA_MANAGER") {
          return isFinalApprovalLevel(item.approvalLevel);
        }

        return normalizeApprovalLevel(item.approvalLevel) === "BU";
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

      //  Fetch requisition details
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
        <div className="request-empty">No rejected requests</div>
      ) : (
        <div className="request-list">
          {data.map((item) => {
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
                <span className={`status-badge status-${(item.approvalStatus || "unknown").toLowerCase().replace(/\s+/g, "")}`}>
                  {formatStatus(item.approvalStatus) || "Unknown"}
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
              </div>

              {isExpanded && (
                <RequisitionInlineDetails
                  loading={expandedLoadingId === item.id}
                  error={expandedError}
                  requisition={details}
                  comments={item.approvalComments}
                  onOpenJd={() => setJdModalRequisition(details)}
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

export default RejectedRequests;