function getServerDisplayName(memberOrInteraction) {
  if (!memberOrInteraction) {
    return "Unknown user";
  }

  if (memberOrInteraction.member?.displayName) {
    return memberOrInteraction.member.displayName;
  }

  if (memberOrInteraction.displayName) {
    return memberOrInteraction.displayName;
  }

  if (memberOrInteraction.user?.displayName) {
    return memberOrInteraction.user.displayName;
  }

  if (memberOrInteraction.user?.username) {
    return memberOrInteraction.user.username;
  }

  if (memberOrInteraction.username) {
    return memberOrInteraction.username;
  }

  return "Unknown user";
}

function getDefaultMemberDisplayName(member) {
  if (!member?.user) {
    return getServerDisplayName(member);
  }

  return member.user.globalName
    || member.user.displayName
    || member.user.username
    || "Unknown user";
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripKnownRankPrefixes(displayName, roleNames = []) {
  const normalizedName = normalizeWhitespace(displayName);
  const sortedRoleNames = [...new Set((roleNames || []).map(normalizeWhitespace).filter(Boolean))]
    .sort((leftName, rightName) => rightName.length - leftName.length);

  for (const roleName of sortedRoleNames) {
    const prefix = `${roleName} `;
    if (normalizedName.toLowerCase().startsWith(prefix.toLowerCase())) {
      return normalizeWhitespace(normalizedName.slice(prefix.length));
    }
  }

  return normalizedName;
}

function getMemberRankName(member, allowedRoleIds = []) {
  if (!member?.roles?.cache) {
    return null;
  }

  const allowedRoleIdSet = new Set(
    Array.isArray(allowedRoleIds) ? allowedRoleIds.filter(Boolean) : []
  );

  const rankRole = member.roles.cache
    .filter((role) => {
      if (role.name === "@everyone" || role.managed) {
        return false;
      }

      if (allowedRoleIdSet.size === 0) {
        return true;
      }

      return allowedRoleIdSet.has(role.id);
    })
    .sort((leftRole, rightRole) => rightRole.position - leftRole.position)
    .first();

  return rankRole?.name || null;
}

async function getLiveGuildMember(interaction) {
  if (!interaction?.guild || !interaction?.user?.id) {
    return null;
  }

  return interaction.guild.members.fetch(interaction.user.id).catch(() => null);
}

async function getGuildMemberById(guild, userId) {
  if (!guild || !userId) {
    return null;
  }

  return guild.members.fetch(userId).catch(() => null);
}

async function getLiveServerDisplayName(interaction) {
  if (!interaction?.guild || !interaction?.user?.id) {
    return getServerDisplayName(interaction);
  }

  const member = await getLiveGuildMember(interaction);

  return getServerDisplayName(member || interaction);
}

async function getServerDisplayNameByUserId(guild, userId) {
  const member = await getGuildMemberById(guild, userId);
  return getServerDisplayName(member || { username: userId });
}

module.exports = {
  getGuildMemberById,
  getDefaultMemberDisplayName,
  getLiveGuildMember,
  getMemberRankName,
  getLiveServerDisplayName,
  getServerDisplayNameByUserId,
  getServerDisplayName,
  normalizeWhitespace,
  stripKnownRankPrefixes
};
