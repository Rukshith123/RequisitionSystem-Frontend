import { useEffect, useState } from "react";
import ApprovalComments from "../components/ApprovalComments";
import { useNavigate, useLocation } from "react-router-dom";
import { getMyRequisitions } from "../services/api";
import { withApprovalComments } from "../services/approvalComments";
import Layout from "../components/Layout";
import "../styles/Dashboard.css";
import "../styles/approvals.css";

function MyRequisitions() {
  const [requisitions, setRequisitions] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const statusFilter = queryParams.get("status");
  const titleByStatus = {
    Pending: "Pending Requisitions",
    BUApproved: "BU Approved Requisitions",
    L3Approved: "Final Approved Requisitions",
    Closed: "Closed Requisitions",
    Rejected: "Rejected Requisitions"
  };
  const descriptionByStatus = {
    Pending: "Review active requisitions awaiting approval and keep new hiring requests moving forward.",
    BUApproved: "Track requisitions that have passed business unit review and are ready for final approval.",
    L3Approved: "Monitor requisitions that are fully approved and ready for the next hiring steps.",
    Closed: "Review completed requisitions and keep visibility on hiring requests that have been closed.",
    Rejected: "See requisitions that were rejected and keep a clear record of declined hiring requests."
  };
  const pageTitle = titleByStatus[statusFilter] || "My Requisitions";
  const pageDescription = descriptionByStatus[statusFilter] || "Manage and monitor your requisitions with clear status tracking, clean details, and quick access to each request.";

  const handleClick = (id) => {
    navigate(`/requisition/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5291/api/requisitions/${id}`, {
        method: "DELETE"
      });

      fetchData(); // refresh
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const data = await getMyRequisitions(user.id);

      let filteredData = data;

      // ✅ Updated filtering (important for new stats)
      if (statusFilter) {
        filteredData = data.filter((item) => item.status === statusFilter);
      }

      const sortedData = filteredData.sort((a, b) => b.id - a.id);

      setRequisitions(withApprovalComments(sortedData));
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

      {requisitions.length === 0 ? (
        <div className="request-empty">No requisitions found</div>
      ) : (
        <div className="request-list">
          {requisitions.map((req) => (
            <article key={req.id} className="request-card my-req-card">
              <div className="request-card-header">
                <div>
                  <h3
                    className="approval-title my-req-title-link"
                    onClick={() => handleClick(req.id)}
                    title="View requisition details"
                  >
                    {req.title || req.requisitionTitle || req.jobTitle || req.position || req.postTitle || "Untitled requisition"}
                  </h3>
                  <p className="my-req-subtitle">Requisition ID #{req.id}</p>
                </div>

                <span className={`status-badge status-${(req.status || "unknown").toLowerCase()}`}>
                  {req.status || "Unknown"}
                </span>
              </div>

              <div className="progress-container my-req-progress">
                <div className={`step ${req.status === "Pending" ? "active" : ""}`}>
                  Pending
                </div>

                <div
                  className={`step ${
                    req.status === "BUApproved" ||
                    req.status === "L3Approved" ||
                    req.status === "Closed"
                      ? "active"
                      : ""
                  }`}
                >
                  BU
                </div>

                <div
                  className={`step ${
                    req.status === "L3Approved" ||
                    req.status === "Closed"
                      ? "active"
                      : ""
                  }`}
                >
                  L3
                </div>

                <div
                  className={`step ${
                    req.status === "Closed" ? "active" : ""
                  }`}
                >
                  Closed
                </div>
              </div>

              <div className="request-detail-grid">
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
              </div>

              <ApprovalComments comments={req.approvalComments} />

              <div className="my-req-actions">
                <button
                  className="my-req-delete-button"
                  onClick={() => handleDelete(req.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}

export default MyRequisitions;