const STORAGE_KEY = "approvalCommentsByRequisition";

const buildCommentKey = (entry) => {
  return [
    entry.requisitionId,
    entry.approvalLevel || "",
    entry.status || "",
    entry.approverId || "",
    (entry.comments || "").trim()
  ].join("::");
};

const normalizeEntry = (entry) => {
  if (!entry?.requisitionId || !entry?.comments?.trim()) {
    return null;
  }

  return {
    id: buildCommentId(entry),
    requisitionId: entry.requisitionId,
    approverId: entry.approverId || null,
    approverName: entry.approverName || "Unknown approver",
    approverRole: entry.approverRole || "",
    approvalLevel: entry.approvalLevel || "",
    status: entry.status || "",
    comments: entry.comments.trim(),
    actionDate: entry.actionDate || new Date().toISOString()
  };
};

const dedupeEntries = (entries) => {
  const uniqueEntries = new Map();

  entries.forEach((entry) => {
    const normalizedEntry = normalizeEntry(entry);
    if (!normalizedEntry) {
      return;
    }

    const semanticKey = buildCommentKey(normalizedEntry);
    const existingEntry = uniqueEntries.get(semanticKey);

    if (!existingEntry) {
      uniqueEntries.set(semanticKey, normalizedEntry);
      return;
    }

    const existingTime = new Date(existingEntry.actionDate).getTime();
    const nextTime = new Date(normalizedEntry.actionDate).getTime();

    if (Number.isNaN(existingTime) || nextTime >= existingTime) {
      uniqueEntries.set(semanticKey, normalizedEntry);
    }
  });

  return Array.from(uniqueEntries.values()).sort(
    (left, right) => new Date(right.actionDate) - new Date(left.actionDate)
  );
};

const readStore = () => {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : {};
    const normalizedStore = Object.fromEntries(
      Object.entries(parsedValue).map(([requisitionId, entries]) => [
        requisitionId,
        dedupeEntries(Array.isArray(entries) ? entries : [])
      ])
    );

    if (rawValue !== JSON.stringify(normalizedStore)) {
      writeStore(normalizedStore);
    }

    return normalizedStore;
  } catch (error) {
    console.error("Failed to read approval comments", error);
    return {};
  }
};

const writeStore = (store) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const buildCommentId = (entry) => {
  const timestamp = entry.actionDate || new Date().toISOString();
  return [
    entry.requisitionId,
    entry.approvalLevel,
    entry.status,
    entry.approverId,
    timestamp,
    entry.comments
  ].join("::");
};

export const getApprovalComments = (requisitionId) => {
  const store = readStore();
  return store[String(requisitionId)] || [];
};

export const saveApprovalComment = (entry) => {
  const normalizedEntry = normalizeEntry(entry);
  if (!normalizedEntry) {
    return [];
  }

  const store = readStore();
  const requisitionKey = String(normalizedEntry.requisitionId);
  const existingEntries = store[requisitionKey] || [];
  const semanticKey = buildCommentKey(normalizedEntry);
  const alreadyExists = existingEntries.some(
    (item) => buildCommentKey(item) === semanticKey
  );
  if (alreadyExists) {
    const dedupedEntries = dedupeEntries(existingEntries);
    store[requisitionKey] = dedupedEntries;
    writeStore(store);
    return dedupedEntries;
  }

  const nextEntries = dedupeEntries([...existingEntries, normalizedEntry]);

  store[requisitionKey] = nextEntries;
  writeStore(store);

  return nextEntries;
};

export const syncApprovalComments = (entries) => {
  entries.forEach((entry) => {
    saveApprovalComment(entry);
  });
};

export const withApprovalComments = (items) => {
  return items.map((item) => ({
    ...item,
    approvalComments: getApprovalComments(item.id)
  }));
};