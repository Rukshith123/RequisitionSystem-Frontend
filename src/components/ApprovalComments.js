function ApprovalComments({ comments }) {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <section className="approval-comments">
      <p className="approval-comments-title">Approval Comments</p>

      <div className="approval-comments-list">
        {comments.map((comment) => {
          const timestamp = comment.actionDate
            ? new Date(comment.actionDate).toLocaleString()
            : "";
          const badgeLabel = [comment.approvalLevel, comment.status]
            .filter(Boolean)
            .join(" ");

          return (
            <article key={comment.id} className="approval-comment-card">
              <div className="approval-comment-meta">
                <div>
                  <p className="approval-comment-author">{comment.approverName || "Unknown approver"}</p>
                  <p className="approval-comment-role">{comment.approverRole || badgeLabel || "Approval update"}</p>
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