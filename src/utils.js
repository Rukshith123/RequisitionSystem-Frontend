export const formatStatus = (status) => {
  const map = {
    BAApproved: "BA Approved",
    BUApproved: "BU Approved",
    OnHold: "On Hold",
    BUOnHold: "BU On Hold",
    BAOnHold: "BA On Hold",
    Rejected: "Rejected",
    BURejected: "BU Rejected",
    BARejected: "BA Rejected",
    Pending: "Pending",
    Cancelled: "Cancelled",
    Closed: "Closed"
  };

  return map[status] || status;
};
