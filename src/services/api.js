const BASE_URL = "http://localhost:5291/api";

// Token is stored in an httpOnly cookie and sent automatically by the browser.
// All requests use credentials: "include" so the cookie is included cross-origin.
const JSON_HEADERS = { "Content-Type": "application/json" };

export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  return res.json();
};

export const logoutUser = async () => {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
};

export const getPendingApprovals = async (role) => {
  const res = await fetch(`${BASE_URL}/approvals/pending?role=${role}`, {
    credentials: "include"
  });

  if (!res.ok) throw new Error("Failed to fetch pending approvals");

  return res.json();
};

export const createRequisition = async (data, createdByUserId) => {
  const response = await fetch(
    `${BASE_URL}/requisitions?createdBy=${Number(createdByUserId)}`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      credentials: "include",
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
      credentials: "include"
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
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch requisitions");
  }

  return response.json();
};

export const getCancelledRequisitions = async () => {
  const response = await fetch(`${BASE_URL}/requisitions/cancelled`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cancelled requisitions");
  }

  return response.json();
};

export const deleteRequisitionPermanently = async (requisitionId) => {
  const response = await fetch(`${BASE_URL}/requisitions/${requisitionId}/permanent`, {
    method: "DELETE",
    credentials: "include"
  });

  if (!response.ok) {
    let message = "Failed to permanently delete requisition";

    try {
      const text = await response.text();
      if (text) {
        const payload = JSON.parse(text);
        message = payload?.message || payload?.error || message;
      }
    } catch {
      // use default message
    }

    throw new Error(message);
  }

  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const getMyRequisitions = async (createdByUsername) => {
  const response = await fetch(
    `${BASE_URL}/requisitions/my?createdBy=${encodeURIComponent(createdByUsername)}`,
    { credentials: "include" }
  );

  return response.json();
};

export const getMyApprovals = async (userId) => {
  const res = await fetch(
    `${BASE_URL}/approvals/my?approverId=${userId}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch approvals");
  }

  return res.json();
};

export const approveRequisition = async (id, approverId, comments) => {
  const res = await fetch(`${BASE_URL}/approvals/${id}/approve`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify({ approverId: Number(approverId), comments })
  });

  if (!res.ok) throw new Error("Approve failed");

  return res.json();
};

export const approveOnHoldRequisition = async (id, approverId, comments) => {
  const res = await fetch(`${BASE_URL}/approvals/${id}/approve`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify({ approverId: Number(approverId), comments })
  });

  if (!res.ok) {
    let message = "Approve failed";

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
    return { actionDate: new Date().toISOString() };
  }
};

export const rejectRequisition = async (id, approverId, comments) => {
  const res = await fetch(`${BASE_URL}/approvals/${id}/reject`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify({ approverId, comments })
  });

  if (!res.ok) {
    let message = "Reject failed";

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

  return res.json();
};

export const holdRequisition = async (id, approverId, comments) => {
  const res = await fetch(`${BASE_URL}/approvals/${id}/hold`, {
    method: "PUT",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify({ approverId: Number(approverId), comments })
  });

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
  const res = await fetch(`${BASE_URL}/recruiter/requisitions/${id}/close`, {
    method: "POST",
    credentials: "include"
  });

  return res.json();
};

export const getApprovedRequisitions = async () => {
  const res = await fetch(`${BASE_URL}/recruiter/requisitions`, {
    credentials: "include"
  });

  if (!res.ok) throw new Error("Failed to fetch approved requisitions");

  return res.json();
};

export const getClosedRequisitions = async () => {
  const res = await fetch(`${BASE_URL}/recruiter/requisitions/closed`, {
    credentials: "include"
  });

  if (!res.ok) throw new Error("Failed to fetch closed requisitions");

  return res.json();
};

export const generateJd = async (formData) => {
  const res = await fetch(`${BASE_URL}/jd/generate`, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify({
      title: formData.title,
      department: formData.department,
      skillset: formData.skillset,
      experienceLevel: formData.experienceLevel,
      numberOfPositions: Number(formData.numberOfPositions) || 1,
      location: formData.location,
      customerName: formData.customerName,
      comments: formData.comments
    })
  });

  if (!res.ok) {
    let message = "Failed to generate JD";
    try {
      const payload = await res.json();
      message = payload?.error || payload?.details || message;
    } catch {
      // use default message
    }
    throw new Error(message);
  }

  const data = await res.json();
  return data.jdContent;
};

export const getRequisitionById = async (requisitionId) => {
  const res = await fetch(`${BASE_URL}/requisitions/${requisitionId}`, {
    credentials: "include"
  });

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