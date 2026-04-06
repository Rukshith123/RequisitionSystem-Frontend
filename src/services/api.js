const BASE_URL = "http://localhost:5291/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
};

export const loginUser = async (username, password) => {
  const res = await fetch("http://localhost:5291/api/auth/login", {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify({
      username,
      password
    })
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  return res.json();
};

export const getPendingApprovals = async (role) => {
  const res = await fetch(
    `${BASE_URL}/approvals/pending?role=${role}`,
    {
      headers: getAuthHeader()
    }
  );

  if (!res.ok) throw new Error("Failed to fetch pending approvals");

  return res.json();
};


export const createRequisition = async (data, createdByUserId) => {
  const response = await fetch(
    `${BASE_URL}/requisitions?createdBy=${Number(createdByUserId)}`,
    {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    }
  );

  return response.json();
};

export const cancelRequisition = async (requisitionId) => {
  const response = await fetch(
    `${BASE_URL}/requisitions/${requisitionId}/cancel`,
    {
      method: "PUT",
      headers: getAuthHeader()
    }
  );

  if (!response.ok) {
    let message = "Failed to cancel requisition";

    try {
      const payload = await response.json();
      message = payload?.message || payload?.error || message;
    } catch (error) {
      const fallbackText = await response.text();
      if (fallbackText) {
        message = fallbackText;
      }
    }

    throw new Error(message);
  }

  return response.json();
};

export const getAllRequisitions = async () => {
  const response = await fetch(`${BASE_URL}/requisitions`, {
    headers: getAuthHeader()
  });

  if (!response.ok) {
    throw new Error("Failed to fetch requisitions");
  }

  return response.json();
};

export const getCancelledRequisitions = async () => {
  const response = await fetch(`${BASE_URL}/requisitions/cancelled`, {
    headers: getAuthHeader()
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cancelled requisitions");
  }

  return response.json();
};

export const deleteRequisitionPermanently = async (requisitionId) => {
  const response = await fetch(`${BASE_URL}/requisitions/${requisitionId}/permanent`, {
    method: "DELETE",
    headers: getAuthHeader()
  });

  if (!response.ok) {
    let message = "Failed to permanently delete requisition";

    try {
      const payload = await response.json();
      message = payload?.message || payload?.error || message;
    } catch (error) {
      const fallbackText = await response.text();
      if (fallbackText) {
        message = fallbackText;
      }
    }

    throw new Error(message);
  }

  return response.json();
};


export const getMyRequisitions = async (createdByUsername) => {
  const response = await fetch(
    `${BASE_URL}/requisitions/my?createdBy=${encodeURIComponent(createdByUsername)}`, {
     headers: getAuthHeader()
     });

  return response.json();
};

export const getMyApprovals = async (userId) => {
  const res = await fetch(
    `http://localhost:5291/api/approvals/my?approverId=${userId}`,
    {
     headers: getAuthHeader()
    });

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
      headers: getAuthHeader(),
      body: JSON.stringify({
        approverId: Number(approverId),
        comments
      })
    }
  );

  if (!res.ok) throw new Error("Approve failed");

  return res.json();
};

export const approveOnHoldRequisition = async (id, approverId) => {
  const res = await fetch(
    `${BASE_URL}/approvals/${id}/approve`,
    {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({
        approverId: Number(approverId)
      })
    }
  );

  if (!res.ok) throw new Error("Approve failed");

  try {
    return await res.json();
  } catch (error) {
    return { actionDate: new Date().toISOString() };
  }
};

export const rejectRequisition = async (id, approverId, comments) => {
  const res = await fetch(
    `http://localhost:5291/api/approvals/${id}/reject`,
    {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({
        approverId,
        comments
      })
    }
  );

  if (!res.ok) throw new Error("Reject failed");

  return res.json();
};

export const holdRequisition = async (id, approverId, comments) => {
  const res = await fetch(
    `${BASE_URL}/approvals/${id}/hold`,
    {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify({ approverId: Number(approverId), comments })
    }
  );

  if (!res.ok) {
    let message = "Hold failed";

    try {
      const payload = await res.json();
      message = payload?.message || payload?.error || message;
    } catch (error) {
      const text = await res.text();
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  try {
    return await res.json();
  } catch (error) {
    return { status: "OnHold", actionDate: new Date().toISOString() };
  }
};

export const closeRequisition = async (id) => {
  const res = await fetch(
    `http://localhost:5291/api/recruiter/requisitions/${id}/close`,
    {
      method: "POST",
      headers: getAuthHeader()
    }
  );

  return res.json();
};

export const getApprovedRequisitions = async () => {
  const res = await fetch(
    `${BASE_URL}/recruiter/requisitions`,
    {
      headers: getAuthHeader()
    }
  );

  if (!res.ok) throw new Error("Failed to fetch approved requisitions");

  return res.json();
};

export const getClosedRequisitions = async () => {
  const res = await fetch(
    `${BASE_URL}/recruiter/requisitions/closed`,
    {
      headers: getAuthHeader()
    }
  );

  if (!res.ok) throw new Error("Failed to fetch closed requisitions");

  return res.json();
};

export const getRequisitionById = async (requisitionId) => {
  const res = await fetch(
    `${BASE_URL}/requisitions/${requisitionId}`,
    {
      headers: getAuthHeader()
    }
  );

  if (!res.ok) throw new Error(`Failed to fetch requisition (${res.status})`);

  const rawBody = await res.text();

  if (!rawBody) {
    throw new Error("Requisition details response was empty");
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new Error("Requisition details response is not valid JSON");
  }
};