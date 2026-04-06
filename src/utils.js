export const formatStatus = (status) => {
  const map = {
    BAApproved: "BA Approved",
    BUApproved: "BU Approved",
    OnHold: "On Hold",
    Rejected: "Rejected",
    Pending: "Pending",
    Cancelled: "Cancelled",
    Closed: "Closed"
  };

  return map[status] || status;
};
