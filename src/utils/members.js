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
  getLiveGuildMember,
  getMemberRankName,
  getLiveServerDisplayName,
  getServerDisplayNameByUserId,
  getServerDisplayName
};
