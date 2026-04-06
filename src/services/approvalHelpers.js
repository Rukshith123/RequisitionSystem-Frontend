const normalize = (value) => (value === null || value === undefined ? "" : String(value).trim().toUpperCase());

export const normalizeApprovalLevel = (level) => {
  const normalized = normalize(level);

  if (normalized === "L3" || normalized === "BA" || normalized === "BA_MANAGER") {
    return "BA";
  }

  if (normalized === "BU" || normalized === "BU_MANAGER") {
    return "BU";
  }

  return normalized;
};

export const isFinalApprovalLevel = (level) => normalizeApprovalLevel(level) === "BA";

export const isApprovedStatus = (status) => {
  const normalized = normalize(status);
  return normalized === "APPROVED" || normalized === "BAAPPROVED" || normalized === "L3APPROVED";
};

export const isRejectedStatus = (status) => normalize(status) === "REJECTED";

export const sortByLatestRequisition = (items) => {
  return [...items].sort((left, right) => {
    const rightTime = new Date(
      right.actionDate || right.updatedAt || right.createdAt || 0
    ).getTime();
    const leftTime = new Date(
      left.actionDate || left.updatedAt || left.createdAt || 0
    ).getTime();

    if (!Number.isNaN(rightTime) && !Number.isNaN(leftTime) && rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return Number(right.id || 0) - Number(left.id || 0);
  });
};

export const getApprovalLevelLabel = (level) => {
  const normalized = normalizeApprovalLevel(level);
  if (normalized === "BA") return "BA";
  if (normalized === "BU") return "BU";
  return level || "";
};

export const getApproverRoleLabel = (role, level) => {
  const normalizedRole = normalize(role);

  if (normalizedRole === "BA_MANAGER" || normalizeApprovalLevel(level) === "BA") {
    return "BA Manager";
  }

  if (normalizedRole === "BU_MANAGER" || normalizeApprovalLevel(level) === "BU") {
    return "BU Manager";
  }

  if (normalizedRole === "RECRUITER") {
    return "Recruiter";
  }

  return role || "Approval update";
};

export const normalizeFinalStatusLabel = (status) => {
  const normalized = normalize(status);

  if (normalized === "L3APPROVED" || normalized === "BAAPPROVED") {
    return "BAApproved";
  }

  return status || "Unknown";
};