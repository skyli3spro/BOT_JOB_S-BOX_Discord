const { ChannelType, EmbedBuilder } = require("discord.js");
const { getDb } = require("../db");
const { getGuildLanguage, t } = require("../utils/i18n");
const {
  getGuildMemberById,
  getMemberRankName,
  getServerDisplayNameByUserId
} = require("../utils/members");
const {
  formatDiscordTimestamp,
  formatDuration
} = require("../utils/formatters");

function getGuildConfig(guildId) {
  return getDb()
    .prepare("SELECT * FROM guild_config WHERE guild_id = ?")
    .get(guildId);
}

function parseRankRoleIds(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return [...new Set(parsedValue.filter((value) => typeof value === "string"))];
  } catch {
    return [];
  }
}

function serializeRankRoleIds(rankRoleIds) {
  return JSON.stringify([...new Set((rankRoleIds || []).filter(Boolean))]);
}

function getConfiguredRankRoleIds(config) {
  return parseRankRoleIds(config?.rank_role_ids);
}

function getConfiguredTrainingRoleIds(config) {
  return parseRankRoleIds(config?.training_role_ids);
}

function upsertGuildConfig(guildId, updates) {
  const current = getGuildConfig(guildId) || {
    guild_id: guildId,
    command_channel_id: null,
    report_channel_id: null,
    command_panel_message_id: null,
    forum_channel_id: null,
    training_forum_channel_id: null,
    report_forum_channel_id: null,
    log_channel_id: null,
    job_name: null,
    language: "en",
    rank_role_ids: "[]",
    training_role_ids: "[]"
  };

  const next = {
    ...current,
    ...updates,
    guild_id: guildId
  };

  next.rank_role_ids = serializeRankRoleIds(
    Array.isArray(next.rank_role_ids)
      ? next.rank_role_ids
      : parseRankRoleIds(next.rank_role_ids)
  );
  next.training_role_ids = serializeRankRoleIds(
    Array.isArray(next.training_role_ids)
      ? next.training_role_ids
      : parseRankRoleIds(next.training_role_ids)
  );

  getDb()
    .prepare(
      `
      INSERT INTO guild_config (
        guild_id,
        command_channel_id,
        report_channel_id,
        command_panel_message_id,
        forum_channel_id,
        training_forum_channel_id,
        report_forum_channel_id,
        log_channel_id,
        job_name,
        language,
        rank_role_ids,
        training_role_ids
      )
      VALUES (
        @guild_id,
        @command_channel_id,
        @report_channel_id,
        @command_panel_message_id,
        @forum_channel_id,
        @training_forum_channel_id,
        @report_forum_channel_id,
        @log_channel_id,
        @job_name,
        @language,
        @rank_role_ids,
        @training_role_ids
      )
      ON CONFLICT(guild_id) DO UPDATE SET
        command_channel_id = excluded.command_channel_id,
        report_channel_id = excluded.report_channel_id,
        command_panel_message_id = excluded.command_panel_message_id,
        forum_channel_id = excluded.forum_channel_id,
        training_forum_channel_id = excluded.training_forum_channel_id,
        report_forum_channel_id = excluded.report_forum_channel_id,
        log_channel_id = excluded.log_channel_id,
        job_name = excluded.job_name,
        language = excluded.language,
        rank_role_ids = excluded.rank_role_ids,
        training_role_ids = excluded.training_role_ids
      `
    )
    .run(next);

  return next;
}

function getUserProfile(guildId, userId) {
  return getDb()
    .prepare(
      "SELECT * FROM user_profiles WHERE guild_id = ? AND user_id = ?"
    )
    .get(guildId, userId);
}

function ensureUserProfile(guildId, userId) {
  getDb()
    .prepare(
      `
      INSERT INTO user_profiles (guild_id, user_id)
      VALUES (?, ?)
      ON CONFLICT(guild_id, user_id) DO NOTHING
      `
    )
    .run(guildId, userId);

  return getUserProfile(guildId, userId);
}

function updateUserProfile(guildId, userId, updates) {
  const current = ensureUserProfile(guildId, userId);
  const next = {
    ...current,
    ...updates,
    guild_id: guildId,
    user_id: userId
  };

  getDb()
    .prepare(
      `
      UPDATE user_profiles
      SET forum_thread_id = @forum_thread_id,
          total_time = @total_time
      WHERE guild_id = @guild_id AND user_id = @user_id
      `
    )
    .run(next);

  return getUserProfile(guildId, userId);
}

function getOpenSession(guildId, userId) {
  return getDb()
    .prepare(
      `
      SELECT * FROM service_sessions
      WHERE guild_id = ? AND user_id = ? AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
      `
    )
    .get(guildId, userId);
}

function getActiveSessions(guildId) {
  return getDb()
    .prepare(
      `
      SELECT *
      FROM service_sessions
      WHERE guild_id = ? AND ended_at IS NULL
      ORDER BY started_at ASC, user_id ASC
      `
    )
    .all(guildId);
}

function startService(guildId, userId) {
  const existing = getOpenSession(guildId, userId);
  if (existing) {
    return { alreadyActive: true, session: existing };
  }

  const startedAt = new Date().toISOString();
  const result = getDb()
    .prepare(
      `
      INSERT INTO service_sessions (guild_id, user_id, started_at)
      VALUES (?, ?, ?)
      `
    )
    .run(guildId, userId, startedAt);

  return {
    alreadyActive: false,
    session: getDb()
      .prepare("SELECT * FROM service_sessions WHERE id = ?")
      .get(result.lastInsertRowid)
  };
}

function stopService(guildId, userId) {
  const current = getOpenSession(guildId, userId);
  if (!current) {
    return { activeSession: null, completedSession: null };
  }

  const endedAt = new Date();
  const startedAt = new Date(current.started_at);
  const duration = Math.max(
    0,
    Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
  );

  getDb()
    .prepare(
      `
      UPDATE service_sessions
      SET ended_at = ?, duration = ?
      WHERE id = ?
      `
    )
    .run(endedAt.toISOString(), duration, current.id);

  const profile = ensureUserProfile(guildId, userId);
  updateUserProfile(guildId, userId, {
    forum_thread_id: profile.forum_thread_id || null,
    total_time: (profile.total_time || 0) + duration
  });

  return {
    activeSession: current,
    completedSession: getDb()
      .prepare("SELECT * FROM service_sessions WHERE id = ?")
      .get(current.id)
  };
}

function getRecentSessions(guildId, userId, limit = 5) {
  return getDb()
    .prepare(
      `
      SELECT * FROM service_sessions
      WHERE guild_id = ? AND user_id = ? AND duration IS NOT NULL
      ORDER BY started_at DESC
      LIMIT ?
      `
    )
    .all(guildId, userId, limit);
}

function getLeaderboard(guildId, limit = 10) {
  return getDb()
    .prepare(
      `
      SELECT user_id, total_time
      FROM user_profiles
      WHERE guild_id = ?
      ORDER BY total_time DESC, user_id ASC
      LIMIT ?
      `
    )
    .all(guildId, limit);
}

function getProfileThreadName(displayName, jobName) {
  return `${displayName} - ${jobName || "Service"}`.slice(0, 100);
}

async function getConfiguredCommandChannel(guild, config) {
  if (!config?.command_channel_id) {
    return null;
  }

  const channel = await guild.channels.fetch(config.command_channel_id);
  if (!channel || channel.type !== ChannelType.GuildText) {
    return null;
  }

  return channel;
}

async function getConfiguredReportCommandChannel(guild, config) {
  if (!config?.report_channel_id) {
    return null;
  }

  const channel = await guild.channels.fetch(config.report_channel_id).catch(() => null);
  if (!channel) {
    return null;
  }

  if (
    channel.type !== ChannelType.GuildText
    && channel.type !== ChannelType.GuildAnnouncement
  ) {
    return null;
  }

  return channel;
}

async function getConfiguredLogChannel(guild, config) {
  if (!config?.log_channel_id) {
    return null;
  }

  const channel = await guild.channels.fetch(config.log_channel_id).catch(() => null);
  if (!channel) {
    return null;
  }

  if (
    channel.type !== ChannelType.GuildText
    && channel.type !== ChannelType.GuildAnnouncement
  ) {
    return null;
  }

  return channel;
}

async function logStaffEvent(guild, config, details) {
  const channel = await getConfiguredLogChannel(guild, config);
  if (!channel) {
    return null;
  }

  const language = getGuildLanguage(config);
  const embed = new EmbedBuilder()
    .setColor(details.color || 0x5865f2)
    .setTitle(details.title || t(language, "staffLogDefaultTitle"))
    .setDescription(details.description || t(language, "staffLogEmptyDescription"))
    .setTimestamp(new Date());

  if (details.footer) {
    embed.setFooter({ text: details.footer });
  }

  return channel.send({ embeds: [embed] }).catch(() => null);
}

function buildCommandGuidePayload(config) {
  const language = getGuildLanguage(config);
  const embed = new EmbedBuilder()
    .setColor(0x2b6cff)
    .setTitle(t(language, "commandGuideTitle"))
    .setDescription(t(language, "commandGuideDescription"))
    .addFields(
      {
        name: t(language, "commandGuideJobField"),
        value: config.job_name || t(language, "configNotSet"),
        inline: false
      },
      {
        name: t(language, "commandGuideStartField"),
        value: t(language, "commandGuideStartValue"),
        inline: true
      },
      {
        name: t(language, "commandGuideStopField"),
        value: t(language, "commandGuideStopValue"),
        inline: true
      },
      {
        name: t(language, "commandGuideStatusField"),
        value: t(language, "commandGuideStatusValue"),
        inline: true
      },
      {
        name: t(language, "commandGuideLeaderboardField"),
        value: t(language, "commandGuideLeaderboardValue"),
        inline: false
      }
    )
    .setFooter({
      text: t(language, "commandGuideFooter")
    });

  return {
    content: null,
    embeds: [embed]
  };
}

async function syncCommandGuideMessage(guild, config) {
  const channel = await getConfiguredCommandChannel(guild, config);
  if (!channel) {
    return null;
  }

  const payload = buildCommandGuidePayload(config);

  if (config.command_panel_message_id) {
    const existingMessage = await channel.messages
      .fetch(config.command_panel_message_id)
      .catch(() => null);

    if (existingMessage) {
      await existingMessage.edit(payload);
      if (!existingMessage.pinned) {
        await existingMessage.pin().catch(() => null);
      }
      return existingMessage;
    }
  }

  const message = await channel.send(payload);
  await message.pin().catch(() => null);

  upsertGuildConfig(guild.id, {
    ...config,
    command_panel_message_id: message.id
  });

  return message;
}

async function getConfiguredForumChannel(guild, config) {
  if (!config?.forum_channel_id) {
    return null;
  }

  const forum = await guild.channels.fetch(config.forum_channel_id);
  if (!forum || forum.type !== ChannelType.GuildForum) {
    throw new Error(t(getGuildLanguage(config), "forumInvalidChannel"));
  }

  return forum;
}

async function getConfiguredTrainingForumChannel(guild, config) {
  if (!config?.training_forum_channel_id) {
    return null;
  }

  const forum = await guild.channels.fetch(config.training_forum_channel_id);
  if (!forum || forum.type !== ChannelType.GuildForum) {
    throw new Error(t(getGuildLanguage(config), "configTrainingForumNotConfigured"));
  }

  return forum;
}

async function getConfiguredReportForumChannel(guild, config) {
  if (!config?.report_forum_channel_id) {
    return null;
  }

  const forum = await guild.channels.fetch(config.report_forum_channel_id).catch(() => null);
  if (!forum || forum.type !== ChannelType.GuildForum) {
    throw new Error(t(getGuildLanguage(config), "configReportForumNotConfigured"));
  }

  return forum;
}

function canManageTrainingGuides(member, config) {
  if (!member) {
    return false;
  }

  const allowedRoleIds = new Set(getConfiguredTrainingRoleIds(config));
  if (allowedRoleIds.size === 0) {
    return false;
  }

  return member.roles?.cache?.some((role) => allowedRoleIds.has(role.id)) || false;
}

function splitTextIntoChunks(text, maxLength = 2000) {
  const normalizedText = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalizedText) {
    return [];
  }

  const chunks = [];
  let remainingText = normalizedText;

  while (remainingText.length > maxLength) {
    let splitIndex = remainingText.lastIndexOf("\n", maxLength);
    if (splitIndex <= 0) {
      splitIndex = remainingText.lastIndexOf(" ", maxLength);
    }
    if (splitIndex <= 0) {
      splitIndex = maxLength;
    }

    chunks.push(remainingText.slice(0, splitIndex).trim());
    remainingText = remainingText.slice(splitIndex).trim();
  }

  if (remainingText) {
    chunks.push(remainingText);
  }

  return chunks;
}

function buildTrainingGuideThreadName(title, fallbackTitle) {
  return String(title || fallbackTitle).trim().slice(0, 100) || fallbackTitle;
}

async function publishTrainingGuide(guild, config, options) {
  const forum = await getConfiguredTrainingForumChannel(guild, config);
  if (!forum) {
    throw new Error(t(getGuildLanguage(config), "configTrainingForumNotConfigured"));
  }

  const chunks = splitTextIntoChunks(options.markdownContent);
  if (chunks.length === 0) {
    throw new Error(t(getGuildLanguage(config), "trainingGuideInvalidFile"));
  }

  const thread = await forum.threads.create({
    name: buildTrainingGuideThreadName(
      options.title,
      t(getGuildLanguage(config), "trainingGuideThreadFallbackTitle")
    ),
    message: {
      content: chunks[0]
    }
  });

  for (const chunk of chunks.slice(1)) {
    await thread.send(chunk);
  }

  return thread;
}

function createReportEntry(guildId, data) {
  const createdAt = new Date().toISOString();
  const result = getDb()
    .prepare(
      `
      INSERT INTO report_entries (
        guild_id,
        author_user_id,
        title,
        subject_name,
        summary,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, 'open', ?)
      `
    )
    .run(
      guildId,
      data.author_user_id,
      data.title,
      data.subject_name || null,
      data.summary,
      createdAt
    );

  return getDb()
    .prepare("SELECT * FROM report_entries WHERE id = ?")
    .get(result.lastInsertRowid);
}

function listReportEntries(guildId, status = "all", limit = 10) {
  const normalizedStatus = status === "open" || status === "closed" ? status : "all";
  const normalizedLimit = Math.max(1, Math.min(Number(limit) || 10, 25));

  if (normalizedStatus === "all") {
    return getDb()
      .prepare(
        `
        SELECT *
        FROM report_entries
        WHERE guild_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ?
        `
      )
      .all(guildId, normalizedLimit);
  }

  return getDb()
    .prepare(
      `
      SELECT *
      FROM report_entries
      WHERE guild_id = ? AND status = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ?
      `
    )
    .all(guildId, normalizedStatus, normalizedLimit);
}

function getReportEntryById(guildId, reportId) {
  return getDb()
    .prepare(
      `
      SELECT *
      FROM report_entries
      WHERE guild_id = ? AND id = ?
      `
    )
    .get(guildId, reportId);
}

function updateReportEntry(guildId, reportId, updates) {
  const current = getReportEntryById(guildId, reportId);
  if (!current) {
    return null;
  }

  const merged = {
    ...current,
    ...updates
  };

  const next = {
    guild_id: guildId,
    id: reportId,
    title: merged.title,
    subject_name: merged.subject_name || null,
    summary: merged.summary,
    status: merged.status,
    created_at: merged.created_at,
    thread_id: merged.thread_id || null,
    closed_at: merged.closed_at || null,
    closed_by_user_id: merged.closed_by_user_id || null
  };

  getDb()
    .prepare(
      `
      UPDATE report_entries
      SET title = @title,
          subject_name = @subject_name,
          summary = @summary,
          status = @status,
          created_at = @created_at,
          thread_id = @thread_id,
          closed_at = @closed_at,
          closed_by_user_id = @closed_by_user_id
      WHERE guild_id = @guild_id AND id = @id
      `
    )
    .run(next);

  return getReportEntryById(guildId, reportId);
}

function getReportThreadName(report, language) {
  const isClosed = report.status === "closed";
  const statusBadge = isClosed
    ? t(language, "reportThreadClosedBadge")
    : t(language, "reportThreadOpenBadge");

  return `${statusBadge} #${report.id} - ${report.title}`.slice(0, 100);
}

function buildReportThreadContent(report, language) {
  const createdAt = formatDiscordTimestamp(new Date(report.created_at));
  const closedAt = report.closed_at
    ? formatDiscordTimestamp(new Date(report.closed_at))
    : null;
  const subject = report.subject_name || t(language, "reportNoSubject");
  const statusLabel = t(
    language,
    report.status === "closed" ? "reportStatusClosed" : "reportStatusOpen"
  );

  const lines = [
    `**${t(language, "reportThreadIdLabel")}:** #${report.id}`,
    `**${t(language, "reportStatusLabel")}:** ${statusLabel}`,
    `**${t(language, "reportAuthorLabel")}:** <@${report.author_user_id}>`,
    `**${t(language, "reportSubjectLabel")}:** ${subject}`,
    `**${t(language, "reportCreatedAtLabel")}:** ${createdAt}`,
    `**${t(language, "reportSummaryLabel")}:** ${report.summary}`
  ];

  if (closedAt) {
    lines.splice(
      5,
      0,
      `**${t(language, "reportClosedAtLabel")}:** ${closedAt}`
    );
  }

  if (report.closed_by_user_id) {
    lines.splice(
      closedAt ? 6 : 5,
      0,
      `**${t(language, "reportClosedByLabel")}:** <@${report.closed_by_user_id}>`
    );
  }

  return lines.join("\n");
}

async function syncReportThread(guild, config, report, options = {}) {
  const createIfMissing = options.createIfMissing !== false;
  const forum = await getConfiguredReportForumChannel(guild, config);
  if (!forum) {
    return null;
  }

  const language = getGuildLanguage(config);
  const threadName = getReportThreadName(report, language);
  const content = buildReportThreadContent(report, language);

  if (report.thread_id) {
    const existingThread = await guild.channels.fetch(report.thread_id).catch(() => null);
    if (existingThread?.parentId === forum.id) {
      if (existingThread.archived && !existingThread.locked) {
        await existingThread.setArchived(false).catch(() => null);
      }

      if (existingThread.name !== threadName) {
        await existingThread.setName(threadName).catch(() => null);
      }

      const starterMessage = await existingThread.fetchStarterMessage().catch(() => null);
      if (starterMessage) {
        await starterMessage.edit(content).catch(() => null);
      } else {
        await existingThread.send(content).catch(() => null);
      }

      return existingThread;
    }

    if (!createIfMissing) {
      return null;
    }
  }

  if (!createIfMissing) {
    return null;
  }

  const thread = await forum.threads.create({
    name: threadName,
    message: {
      content
    }
  });

  updateReportEntry(report.guild_id, report.id, {
    thread_id: thread.id
  });

  return thread;
}

function closeReportEntry(guildId, reportId, closedByUserId) {
  const report = getReportEntryById(guildId, reportId);
  if (!report || report.status === "closed") {
    return report || null;
  }

  getDb()
    .prepare(
      `
      UPDATE report_entries
      SET status = 'closed',
          closed_at = ?,
          closed_by_user_id = ?
      WHERE guild_id = ? AND id = ?
      `
    )
    .run(new Date().toISOString(), closedByUserId, guildId, reportId);

  return getReportEntryById(guildId, reportId);
}

async function ensureProfileThread(interaction, config, profile) {
  return ensureProfileThreadForUser(
    interaction.guild,
    interaction.guildId,
    interaction.user.id,
    config,
    profile
  );
}

async function ensureProfileThreadForUser(guild, guildId, userId, config, profile) {
  if (!config.forum_channel_id) {
    return null;
  }

  const forum = await getConfiguredForumChannel(guild, config);

  const displayName = await getServerDisplayNameByUserId(guild, userId);
  const expectedThreadName = getProfileThreadName(displayName, config.job_name);

  if (profile.forum_thread_id) {
    try {
      const existingThread = await guild.channels.fetch(
        profile.forum_thread_id
      );

      if (existingThread?.parentId === forum.id) {
        if (existingThread.archived && !existingThread.locked) {
          await existingThread.setArchived(false).catch(() => null);
        }

        if (existingThread.name !== expectedThreadName) {
          await existingThread.setName(expectedThreadName).catch(() => null);
        }

        return existingThread;
      }
    } catch {
      // The saved forum post may have been deleted. Recreate it below.
    }
  }

  const post = await forum.threads.create({
    name: expectedThreadName,
    message: {
      content: t(getGuildLanguage(config), "forumInitMessage")
    }
  });

  updateUserProfile(guildId, userId, {
    forum_thread_id: post.id,
    total_time: profile.total_time || 0
  });

  return post;
}

async function updateProfileThreadForUser(guild, guildId, userId, status) {
  const config = getGuildConfig(guildId);
  if (!config || !config.forum_channel_id) {
    return;
  }
  const language = getGuildLanguage(config);

  const profile = ensureUserProfile(guildId, userId);
  const thread = await ensureProfileThreadForUser(guild, guildId, userId, config, profile);
  if (!thread) {
    return;
  }

  const refreshedProfile = getUserProfile(guildId, userId);
  const recentSessions = getRecentSessions(guildId, userId, 5);
  const openSession = getOpenSession(guildId, userId);
  const member = await getGuildMemberById(guild, userId);
  const displayName = await getServerDisplayNameByUserId(guild, userId);
  const rankName =
    getMemberRankName(member, getConfiguredRankRoleIds(config))
    || t(language, "forumRankNone");

  const historyLines =
    recentSessions.length > 0
      ? recentSessions.map((session) => {
          const startedAt = formatDiscordTimestamp(new Date(session.started_at));
          const endedAt = session.ended_at
            ? formatDiscordTimestamp(new Date(session.ended_at))
            : t(language, "forumActiveSessionNone");

          return t(language, "forumSessionHistoryLine", {
            startedAt,
            endedAt,
            duration: formatDuration(session.duration || 0)
          });
        })
      : [t(language, "forumNoCompletedSessions")];

  const content = [
    `**${t(language, "forumAgentLabel")}:** ${displayName}`,
    `**${t(language, "forumRankLabel")}:** ${rankName}`,
    `**${t(language, "forumJobLabel")}:** ${
      config.job_name || t(language, "configNotSet")
    }`,
    `**${t(language, "forumStatusLabel")}:** ${status}`,
    `**${t(language, "forumTotalTimeLabel")}:** ${formatDuration(
      refreshedProfile.total_time || 0
    )}`,
    `**${t(language, "forumActiveSessionLabel")}:** ${
      openSession
        ? t(language, "forumActiveSessionStarted", {
            startedAt: formatDiscordTimestamp(new Date(openSession.started_at))
          })
        : t(language, "forumActiveSessionNone")
    }`,
    "",
    t(language, "forumRecentSessionsTitle"),
    ...historyLines
  ].join("\n");

  const starterMessage = await thread.fetchStarterMessage().catch(() => null);
  if (starterMessage) {
    await starterMessage.edit(content);
  } else {
    await thread.send(content);
  }
}

async function updateProfileThread(interaction, status) {
  return updateProfileThreadForUser(
    interaction.guild,
    interaction.guildId,
    interaction.user.id,
    status
  );
}

function clearForumThreadIdsForGuild(guildId) {
  getDb()
    .prepare(
      `
      UPDATE user_profiles
      SET forum_thread_id = NULL
      WHERE guild_id = ?
      `
    )
    .run(guildId);
}

async function deleteThreadById(guild, threadId, reason) {
  if (!guild || !threadId) {
    return false;
  }

  try {
    const thread = await guild.channels.fetch(threadId);
    if (!thread) {
      return false;
    }

    await thread.delete(reason);
    return true;
  } catch {
    return false;
  }
}

async function resetUserServiceData(guild, guildId, userId) {
  const profile = getUserProfile(guildId, userId);
  const deletedProfileThreads = profile?.forum_thread_id
    ? Number(
        await deleteThreadById(
          guild,
          profile.forum_thread_id,
          "User service data reset requested by administrator"
        )
      )
    : 0;

  const deletedSessions = getDb()
    .prepare(
      `
      DELETE FROM service_sessions
      WHERE guild_id = ? AND user_id = ?
      `
    )
    .run(guildId, userId).changes;

  const deletedProfiles = getDb()
    .prepare(
      `
      DELETE FROM user_profiles
      WHERE guild_id = ? AND user_id = ?
      `
    )
    .run(guildId, userId).changes;

  return {
    deletedProfileThreads,
    deletedProfiles,
    deletedSessions
  };
}

async function resetGuildServiceData(guild, guildId) {
  const profiles = getDb()
    .prepare(
      `
      SELECT forum_thread_id
      FROM user_profiles
      WHERE guild_id = ? AND forum_thread_id IS NOT NULL
      `
    )
    .all(guildId);

  let deletedProfileThreads = 0;
  for (const profile of profiles) {
    deletedProfileThreads += Number(
      await deleteThreadById(
        guild,
        profile.forum_thread_id,
        "Guild service data reset requested by administrator"
      )
    );
  }

  const deletedSessions = getDb()
    .prepare(
      `
      DELETE FROM service_sessions
      WHERE guild_id = ?
      `
    )
    .run(guildId).changes;

  const deletedProfiles = getDb()
    .prepare(
      `
      DELETE FROM user_profiles
      WHERE guild_id = ?
      `
    )
    .run(guildId).changes;

  return {
    deletedProfileThreads,
    deletedProfiles,
    deletedSessions
  };
}

async function resetAllServiceData(client) {
  const profileRows = getDb()
    .prepare(
      `
      SELECT guild_id, forum_thread_id
      FROM user_profiles
      WHERE forum_thread_id IS NOT NULL
      `
    )
    .all();

  let deletedProfileThreads = 0;
  const guildCache = new Map();

  for (const row of profileRows) {
    let guild = guildCache.get(row.guild_id);
    if (guild === undefined) {
      guild = client.guilds.cache.get(row.guild_id)
        || await client.guilds.fetch(row.guild_id).catch(() => null);
      guildCache.set(row.guild_id, guild || null);
    }

    deletedProfileThreads += Number(
      await deleteThreadById(
        guild,
        row.forum_thread_id,
        "Global service data reset requested by administrator"
      )
    );
  }

  const deletedSessions = getDb()
    .prepare("DELETE FROM service_sessions")
    .run().changes;
  const deletedProfiles = getDb()
    .prepare("DELETE FROM user_profiles")
    .run().changes;
  const deletedConfigs = getDb()
    .prepare("DELETE FROM guild_config")
    .run().changes;

  return {
    deletedConfigs,
    deletedProfileThreads,
    deletedProfiles,
    deletedSessions
  };
}

async function wipeConfiguredForum(guild, config) {
  const forum = await getConfiguredForumChannel(guild, config);
  if (!forum) {
    return null;
  }

  const activeResult = await forum.threads.fetchActive(false);
  const archivedResult = await forum.threads.fetchArchived(
    { fetchAll: true },
    false
  );

  const threads = new Map();
  for (const [threadId, thread] of activeResult.threads) {
    threads.set(threadId, thread);
  }
  for (const [threadId, thread] of archivedResult.threads) {
    threads.set(threadId, thread);
  }

  let deletedCount = 0;
  let failedCount = 0;

  for (const thread of threads.values()) {
    try {
      await thread.delete("Forum wipe requested by administrator");
      deletedCount += 1;
    } catch {
      failedCount += 1;
    }
  }

  clearForumThreadIdsForGuild(guild.id);

  return {
    deletedCount,
    failedCount
  };
}

function assertCommandChannel(interaction, config) {
  if (
    config &&
    config.command_channel_id &&
    interaction.channelId !== config.command_channel_id
  ) {
    throw new Error(t(getGuildLanguage(config), "commandChannelOnly"));
  }
}

function assertReportCommandChannel(interaction, config) {
  if (!config) {
    return;
  }

  const reportChannelId = config.report_channel_id;
  const fallbackChannelId = config.command_channel_id;
  const reportForumId = config.report_forum_channel_id;
  const parentId = interaction.channel?.parentId || null;

  if (reportChannelId) {
    if (interaction.channelId !== reportChannelId && parentId !== reportForumId) {
      throw new Error(t(getGuildLanguage(config), "reportChannelOnly"));
    }
    return;
  }

  if (fallbackChannelId && interaction.channelId !== fallbackChannelId && parentId !== reportForumId) {
    throw new Error(t(getGuildLanguage(config), "reportChannelOnly"));
  }
}

module.exports = {
  assertCommandChannel,
  assertReportCommandChannel,
  ensureUserProfile,
  getGuildConfig,
  getConfiguredRankRoleIds,
  getConfiguredTrainingRoleIds,
  getActiveSessions,
  getLeaderboard,
  getOpenSession,
  getRecentSessions,
  getUserProfile,
  canManageTrainingGuides,
  closeReportEntry,
  createReportEntry,
  publishTrainingGuide,
  getConfiguredLogChannel,
  getConfiguredReportCommandChannel,
  getConfiguredReportForumChannel,
  resetAllServiceData,
  resetGuildServiceData,
  resetUserServiceData,
  getReportEntryById,
  syncReportThread,
  updateReportEntry,
  listReportEntries,
  logStaffEvent,
  syncCommandGuideMessage,
  wipeConfiguredForum,
  startService,
  stopService,
  updateProfileThread,
  updateProfileThreadForUser,
  upsertGuildConfig
};
