import { useEffect, useState } from "react";
import ApprovalComments from "../components/ApprovalComments";
import Layout from "../components/Layout";
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
import "../styles/Dashboard.css";
import "../styles/approvals.css";

function ApprovedRequests() {
  const [data, setData] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const pageTitle = user.role === "RECRUITER"
    ? "Approved Requisitions"
    : user.role === "L3_MANAGER"
      ? "Final Approved Requests"
      : "BU Approved Requests";
  const pageDescription = user.role === "RECRUITER"
    ? "Review approved requisitions that are ready for hiring and close fulfilled positions when recruitment is complete."
    : user.role === "L3_MANAGER"
      ? "Track final approvals you have completed and keep visibility on requisitions that passed the last review stage."
      : "Review business unit approvals you have completed and follow requisitions that moved past BU review.";

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    try {
      // 🔥 RECRUITER FLOW (clean)
      if (user.role === "RECRUITER") {
        const result = await getApprovedRequisitions();

        setData(withApprovalComments(result));
        return;
      }

      // 🔵 BU & 🟣 L3 FLOW
      const approvals = await getMyApprovals(user.id);

      const filtered = approvals.filter((item) => {
        if (user.role === "BU_MANAGER") {
          return item.status === "Approved" && item.approvalLevel === "BU";
        }

        if (user.role === "L3_MANAGER") {
          return item.status === "Approved" && item.approvalLevel === "L3";
        }

        return false;
      });

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

  // 🔥 CLOSE FUNCTION
  const handleClose = async (id) => {
    const confirmAction = window.confirm("Close this requisition?");
    if (!confirmAction) return;

    setLoadingId(id);

    await closeRequisition(id);

    setLoadingId(null);

    fetchApproved();
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
            const statusValue = item.status || item.approvalStatus || "Unknown";

            return (
              <article
                key={item.id}
                className="approval-card request-card"
              >
                <div className="request-card-header">
                  <div>
                    <h3 className="approval-title">{item.title || "Untitled requisition"}</h3>
                    <p className="my-req-subtitle">Requisition ID #{item.id}</p>
                  </div>
                  <span className={`status-badge status-${statusValue.toLowerCase()}`}>
                    {statusValue}
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

                {user.role === "RECRUITER" && (
                  <div className="approval-actions">
                    <button
                      className="approval-action-button approval-action-close"
                      onClick={() => handleClose(item.id)}
                      disabled={loadingId === item.id}
                    >
                      {loadingId === item.id ? "Closing..." : "Close"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export default ApprovedRequests;