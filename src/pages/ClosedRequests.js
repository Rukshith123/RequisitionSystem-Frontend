import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import JDViewerModal from "../components/JDViewerModal";
import RequisitionInlineDetails from "../components/RequisitionInlineDetails";
import { getClosedRequisitions, getRequisitionById } from "../services/api";
import { withApprovalComments } from "../services/approvalComments";
import { sortByLatestRequisition } from "../services/approvalHelpers";
import { formatStatus } from "../utils";
import "../styles/Dashboard.css";
import "../styles/approvals.css";

function ClosedRequests() {
  const [data, setData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedLoadingId, setExpandedLoadingId] = useState(null);
  const [expandedError, setExpandedError] = useState("");
  const [jdModalRequisition, setJdModalRequisition] = useState(null);

  const pageDescription = "Track requisitions that have been fully closed and keep visibility on completed hiring outcomes.";

  useEffect(() => {
    fetchClosed();
  }, []);

  const fetchClosed = async () => {
    try {
      const result = await getClosedRequisitions();
      const sorted = sortByLatestRequisition(result.requisitions || []);
      setData(withApprovalComments(sorted));
    } catch (error) {
      console.error("Error fetching closed requests:", error);
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

    if (expandedDetails[item.id]) return;

    setExpandedLoadingId(item.id);

    try {
      const details = await getRequisitionById(item.id);
      setExpandedDetails((prev) => ({
        ...prev,
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
        <h1>Closed Requisitions</h1>
        <p>{pageDescription}</p>
      </section>

      {data.length === 0 ? (
        <div className="request-empty">No closed requests</div>
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

export default ClosedRequests;