import { useEffect } from "react";
import ApprovalComments from "./ApprovalComments";

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
}) : "—";

const detailFields = [
  ["Title", "title"],
  ["Department", "department"],
  ["Skillset", "skillset"],
  ["Experience Level", "experienceLevel"],
  ["Number of Positions", "numberOfPositions"],
  ["Location", "location"],
  ["Hire By Date", "hireByDate"],
  ["Submitted On", "createdAt"],
  ["Customer Name", "customerName"],
  ["Comments", "comments"]
];

const getFieldValue = (requisition, field) => {
  const value = requisition?.[field];

  if (!value && field === "hireByDate") {
    return "-";
  }

  if (field === "hireByDate" && value) {
    return fmt(value);
  }

  if (field === "createdAt" && value) {
    return fmt(value);
  }

  return value || "-";
};

const getJdContent = (requisition) => requisition?.jdContent || requisition?.JDContent || "";

function RequisitionInlineDetails({
  loading,
  error,
  requisition,
  comments,
  onOpenJd,
  actions
}) {
  const user = JSON.parse(localStorage.getItem("user"));
  const isBuOrBa = user?.role === "BU_MANAGER" || user?.role === "BA_MANAGER";

  useEffect(() => {
    if (isBuOrBa && requisition) {
      console.log("Requisition detail payload:", requisition);
    }
  }, [isBuOrBa, requisition]);

  const submittedBy = (typeof requisition?.createdBy === "string" && requisition.createdBy.trim())
    || requisition?.creator?.username
    || requisition?.creator?.name
    || requisition?.Creator?.Username
    || requisition?.Creator?.Name
    || "Unknown";

  return (
    <section className="approval-detail-panel">
      {loading && <p className="request-banner">Loading full requisition...</p>}
      {error && <p className="request-banner">{error}</p>}

      {!loading && !error && requisition && (
        <div className="approval-detail-layout">
          <div className="approval-detail-left">
            {isBuOrBa && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Submitted by: {submittedBy}</p>
                <p style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", margin: "4px 0 0" }}>
                  {submittedBy}
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
                  {fmt(requisition?.createdAt)}
                </p>
              </div>
            )}

            <div className="request-detail-grid">
              {detailFields.map(([label, field]) => (
                <div className="request-detail-item" key={field}>
                  <p className="request-detail-label">{label}</p>
                  <p className="request-detail-value">{getFieldValue(requisition, field)}</p>
                </div>
              ))}
            </div>

            <ApprovalComments
              comments={comments || requisition.approvalComments}
              title={isBuOrBa ? "CU Manager Comments" : "Approval Comments"}
            />

            {actions ? <div className="approval-actions">{actions}</div> : null}
          </div>

          <aside className="approval-detail-jd">
            <div className="approval-detail-jd-header">
              <h3>Job Description</h3>
              <button
                type="button"
                className="approval-view-button approval-view-button-jd"
                onClick={onOpenJd}
              >
                Open Fullscreen
              </button>
            </div>
            <div
              className="approval-detail-jd-content"
              dangerouslySetInnerHTML={{
                __html: getJdContent(requisition) || "<p>No job description available.</p>"
              }}
            />
          </aside>
        </div>
      )}
    </section>
  );
}

export default RequisitionInlineDetails;