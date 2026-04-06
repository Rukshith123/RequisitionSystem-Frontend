import { useEffect, useState } from "react";
import ApprovalComments from "../components/ApprovalComments";
import Layout from "../components/Layout";
import { getClosedRequisitions } from "../services/api";
import { withApprovalComments } from "../services/approvalComments";
import {
  normalizeFinalStatusLabel,
  sortByLatestRequisition
} from "../services/approvalHelpers";
import { formatStatus } from "../utils";
import "../styles/Dashboard.css";
import "../styles/approvals.css";

function ClosedRequests() {
  const [data, setData] = useState([]);
  const pageDescription = "Track requisitions that have been fully closed and keep visibility on completed hiring outcomes.";

  useEffect(() => {
    fetchClosed();
  }, []);

  const fetchClosed = async () => {
    try {
      const result = await getClosedRequisitions();

      const sorted = sortByLatestRequisition(result.requisitions || []);
      setData(withApprovalComments(sorted)); // backend returns { totalClosed, requisitions }

    } catch (error) {
      console.error("Error fetching closed requests:", error);
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
          {data.map((item) => (
            (() => {
              const statusLabel = normalizeFinalStatusLabel(item.status);

              return (
            <article key={item.id} className="approval-card request-card">
              <div className="request-card-header">
                <h3 className="approval-title">{item.title || "Untitled requisition"}</h3>
                <span className={`status-badge status-${(statusLabel || "unknown").toLowerCase()}`}>
                  {formatStatus(statusLabel)}
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
            </article>
              );
            })()
          ))}
        </div>
      )}
    </Layout>
  );
}

export default ClosedRequests;