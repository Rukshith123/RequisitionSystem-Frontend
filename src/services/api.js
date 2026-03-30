const BASE_URL = "http://localhost:5291/api";

export const createRequisition = async (data, createdBy) => {
  const response = await fetch(
    `${BASE_URL}/requisitions?createdBy=${createdBy}`, 
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );

  return response.json();
};


export const getMyRequisitions = async (createdBy) => {
  const response = await fetch(
    `http://localhost:5291/api/requisitions/my?createdBy=${createdBy}`
  );

  return response.json();
};

export const getMyApprovals = async (userId) => {
  const res = await fetch(
    `http://localhost:5291/api/approvals/my?approverId=${userId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch approvals");
  }

  return res.json();
};

export const approveRequisition = async (id, approverId, comments) => {
  const res = await fetch(
    `http://localhost:5291/api/approvals/${id}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        approverId,
        comments
      })
    }
  );

  if (!res.ok) throw new Error("Approve failed");

  return res.json();
};

export const rejectRequisition = async (id, approverId, comments) => {
  const res = await fetch(
    `http://localhost:5291/api/approvals/${id}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        approverId,
        comments
      })
    }
  );

  if (!res.ok) throw new Error("Reject failed");

  return res.json();
};

export const closeRequisition = async (id) => {
  const res = await fetch(
    `http://localhost:5291/api/recruiter/requisitions/${id}/close`,
    {
      method: "POST"
    }
  );

  return res.json();
};