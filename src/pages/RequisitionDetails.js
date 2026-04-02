import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ApprovalComments from "../components/ApprovalComments";
import Layout from "../components/Layout";
import { getRequisitionById } from "../services/api";
import { getApprovalComments } from "../services/approvalComments";
import "../styles/approvals.css";
import "../styles/requisitionDetails.css";

function RequisitionDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const getDashboardRoute = () => {
    if (location.state?.fromDashboard) {
      return location.state.fromDashboard;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (user?.role === "CU_MANAGER") return "/dashboard";
    if (user?.role === "BU_MANAGER") return "/dashboard";
    if (user?.role === "L3_MANAGER") return "/dashboard";
    if (user?.role === "RECRUITER") return "/dashboard";

    return "/dashboard";
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setError("");

    try {
      const result = await getRequisitionById(id);
      setData({
        ...result,
        approvalComments: getApprovalComments(result.id)
      });
    } catch (fetchError) {
      setData(null);
      setError(fetchError.message || "Unable to load requisition details.");
    }
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
          <div className="rd-card rd-loading">
            {error || "Loading requisition details..."}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="rd-page">
        <div className="rd-top-actions">
          <button className="rd-back-button" onClick={() => navigate(getDashboardRoute())}>Back</button>
        </div>

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