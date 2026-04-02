import { useEffect, useState } from "react";
import ApprovalComments from "../components/ApprovalComments";
import Layout from "../components/Layout";
import { getMyApprovals, getRequisitionById } from "../services/api";
import {
  syncApprovalComments,
  withApprovalComments
} from "../services/approvalComments";
import "../styles/Dashboard.css";
import "../styles/approvals.css";

function RejectedRequests() {
  const [data, setData] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const pageTitle = user?.role === "L3_MANAGER"
    ? "L3 Rejected Requests"
    : "BU Rejected Requests";
  const pageDescription = user?.role === "L3_MANAGER"
    ? "Review requisitions rejected at the final approval stage and keep clarity on the decisions made."
    : "Review requisitions rejected during business unit approval and track what was declined before final review.";

  useEffect(() => {
    fetchRejected();
  }, []);

  const fetchRejected = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const approvals = await getMyApprovals(user.id);
      const level = user.role === "L3_MANAGER" ? "L3" : "BU";
      //  Filter rejected by BU/L3
      const filtered = approvals.filter(
        (item) =>
          item.status?.toLowerCase() === "rejected" &&
          item.approvalLevel?.toUpperCase() === level
      );

      syncApprovalComments(
        filtered.map((item) => ({
          requisitionId: item.requisitionId,
          approverId: item.approverId,
          approverName: user.username,
          approverRole: user.role,
          approvalLevel: item.approvalLevel,
          status: item.status,
          comments: item.comments,
          actionDate: item.actionDate
        }))
      );

      //  Fetch requisition details
      const detailed = await Promise.all(
        filtered.map(async (item) => {
          const req = await getRequisitionById(item.requisitionId);

          return {
            ...req,
            approvalStatus: item.status
          };
        })
      );

      setData(withApprovalComments(detailed));

    } catch (error) {
      console.error(error);
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
          {data.map((item) => (
            <article key={item.id} className="approval-card request-card">
              <div className="request-card-header">
                <h3 className="approval-title">{item.title || "Untitled requisition"}</h3>
                <span className={`status-badge status-${(item.approvalStatus || "unknown").toLowerCase()}`}>
                  {item.approvalStatus || "Unknown"}
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
          ))}
        </div>
      )}
    </Layout>
  );
}

export default RejectedRequests;