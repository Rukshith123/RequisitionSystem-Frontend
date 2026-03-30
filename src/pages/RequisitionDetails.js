import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApprovalComments from "../components/ApprovalComments";
import Layout from "../components/Layout";
import { getApprovalComments } from "../services/approvalComments";
import "../styles/approvals.css";
import "../styles/requisitionDetails.css";

function RequisitionDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await fetch(`http://localhost:5291/api/requisitions/${id}`);
    const result = await res.json();
    setData({
      ...result,
      approvalComments: getApprovalComments(result.id)
    });
  };

  const getStatusClass = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    if (normalizedStatus === "pending") return "rd-status-pending";
    if (normalizedStatus === "buapproved") return "rd-status-buapproved";
    if (normalizedStatus === "l3approved") return "rd-status-l3approved";
    if (normalizedStatus === "rejected") return "rd-status-rejected";
    if (normalizedStatus === "closed") return "rd-status-closed";
    return "rd-status-unknown";
  };

  if (!data) {
    return (
      <Layout>
        <div className="rd-page">
          <div className="rd-card rd-loading">Loading requisition details...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="rd-page">
        <button className="rd-back-button" onClick={() => navigate("/my")}>Back</button>

        <section className="rd-card">
          <div className="rd-header">
            <p className="rd-eyebrow">Requisition</p>
            <h2>{data.title || "Untitled requisition"}</h2>
          </div>

          <div className="rd-grid">
            <div className="rd-row">
              <p className="rd-label">Department</p>
              <p className="rd-value">{data.department || "-"}</p>
            </div>
            <div className="rd-row">
              <p className="rd-label">Skillset</p>
              <p className="rd-value">{data.skillset || "-"}</p>
            </div>
            <div className="rd-row">
              <p className="rd-label">Experience</p>
              <p className="rd-value">{data.experienceLevel || "-"}</p>
            </div>
            <div className="rd-row">
              <p className="rd-label">Positions</p>
              <p className="rd-value">{data.numberOfPositions ?? "-"}</p>
            </div>
          </div>

          <div className="rd-status-row">
            <p className="rd-label">Status</p>
            <span className={`rd-status-badge ${getStatusClass(data.status)}`}>
              {data.status || "Unknown"}
            </span>
          </div>

          <ApprovalComments comments={data.approvalComments} />
        </section>
      </div>
    </Layout>
  );
}

export default RequisitionDetails;