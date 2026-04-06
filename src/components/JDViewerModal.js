import "../styles/Dashboard.css";

function JDViewerModal({ requisition, onClose }) {
  if (!requisition) {
    return null;
  }

  return (
    <div className="jd-modal-overlay" role="presentation">
      <div className="jd-modal" role="dialog" aria-modal="true" aria-labelledby="jd-modal-title">
        <button type="button" className="jd-modal-close-icon" onClick={onClose} aria-label="Close JD modal">
          X
        </button>

        <div className="jd-modal-header">
          <h3 id="jd-modal-title">{requisition.title || "Untitled requisition"} - Job Description</h3>
        </div>

        <div className="jd-modal-content">
          <div className="jd-modal-logo-wrap">
            <img src="/nexer-logo.png" alt="Nexer logo" className="jd-modal-logo" />
          </div>

          <div
            className="jd-modal-body"
            dangerouslySetInnerHTML={{ __html: requisition.jdContent || "<p>No job description available.</p>" }}
          />
        </div>

        <div className="jd-modal-footer">
          <button type="button" className="jd-modal-close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default JDViewerModal;
