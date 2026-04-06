const normalize = (value) => (value === null || value === undefined ? "" : String(value).trim().toLowerCase());

const getOwnerUsernames = (item) => {
  const directValues = [
    item?.createdBy,
    item?.createdByUsername,
    item?.createdByUserName,
    item?.createdByUser,
    item?.owner,
    item?.ownerUsername,
    item?.requestedBy,
    item?.requestedByUsername,
    item?.requestor,
    item?.userName,
    item?.username
  ];

  const nestedValues = [
    item?.creator?.username,
    item?.creator?.userName,
    item?.createdByUser?.username,
    item?.createdByUser?.userName,
    item?.createdByUser?.name,
    item?.ownerUser?.username,
    item?.ownerUser?.userName,
    item?.requestedByUser?.username,
    item?.requestedByUser?.userName
  ];

  return [...directValues, ...nestedValues]
    .map(normalize)
    .filter(Boolean);
};

const getOwnerIds = (item) => {
  const idCandidates = [
    item?.createdById,
    item?.ownerId,
    item?.requestedById,
    item?.userId,
    item?.creator?.id,
    item?.createdByUser?.id,
    item?.ownerUser?.id,
    item?.requestedByUser?.id
  ];

  return idCandidates.map(normalize).filter(Boolean);
};

export const filterRequisitionsForCurrentUser = (items, user) => {
  if (!Array.isArray(items)) {
    return [];
  }

  if (!user || user.role !== "CU_MANAGER") {
    return items;
  }

  const usernameCandidates = [user?.username, user?.userName, user?.name]
    .map(normalize)
    .filter(Boolean);
  const userIdCandidates = [user?.id, user?.userId]
    .map(normalize)
    .filter(Boolean);

  const hasOwnershipHints = items.some((item) => {
    return getOwnerUsernames(item).length > 0 || getOwnerIds(item).length > 0;
  });

  if (!hasOwnershipHints) {
    return items;
  }

  return items.filter((item) => {
    const ownerUsernames = getOwnerUsernames(item);
    const ownerIds = getOwnerIds(item);

    const usernameMatch = ownerUsernames.some((ownerUsername) => usernameCandidates.includes(ownerUsername));
    const idMatch = ownerIds.some((ownerId) => userIdCandidates.includes(ownerId));

    return usernameMatch || idMatch;
  });
};