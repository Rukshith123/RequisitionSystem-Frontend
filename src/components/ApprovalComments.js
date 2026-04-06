import { getApprovalLevelLabel, getApproverRoleLabel } from "../services/approvalHelpers";
import { formatStatus } from "../utils";

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
}) : "—";

function ApprovalComments({ comments, title = "Approval Comments" }) {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <section className="approval-comments">
      <p className="approval-comments-title">{title}</p>

      <div className="approval-comments-list">
        {comments.map((comment) => {
          const timestamp = comment.actionDate ? fmt(comment.actionDate) : "";
          const levelLabel = getApprovalLevelLabel(comment.approvalLevel);
          const badgeLabel = [levelLabel, comment.status]
            .map((value) => (value === comment.status ? formatStatus(value) : value))
            .filter(Boolean)
            .join(" ");
          const roleLabel = getApproverRoleLabel(comment.approverRole, comment.approvalLevel);

          return (
            <article key={comment.id} className="approval-comment-card">
              <div className="approval-comment-meta">
                <div>
                  <p className="approval-comment-author">{comment.approverName || "Unknown approver"}</p>
                  <p className="approval-comment-role">{roleLabel || badgeLabel || "Approval update"}</p>
                </div>
                {badgeLabel && (
                  <span className="approval-comment-badge">{badgeLabel}</span>
                )}
              </div>

              <p className="approval-comment-text">{comment.comments}</p>

              {timestamp && <p className="approval-comment-date">{timestamp}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ApprovalComments;