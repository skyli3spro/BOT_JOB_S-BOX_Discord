const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["fr", "en"];

const translations = {
  fr: {
    configCommandDescription: "Configure le bot de service pour ce serveur.",
    configChannelSubcommandDescription:
      "Definit le salon autorise pour les commandes de service.",
    configChannelOptionDescription: "Salon texte pour les commandes de service",
    configForumSubcommandDescription:
      "Definit le forum utilise pour les profils utilisateurs.",
    configForumOptionDescription: "Forum pour les profils de service",
    configJobNameSubcommandDescription:
      "Definit le nom du metier RP affiche dans les profils.",
    configJobNameOptionDescription: "Nom du metier RP",
    configLanguageSubcommandDescription: "Definit la langue utilisee par le bot.",
    configLanguageOptionDescription: "Langue des messages du bot",
    configWipeForumSubcommandDescription:
      "Supprime tous les posts du forum configure.",
    configWipeForumOptionDescription:
      "Tapez CONFIRMER pour valider le wipe du forum",
    configShowSubcommandDescription: "Affiche la configuration actuelle.",
    configShowEmpty: "Aucune configuration n'est encore enregistree pour ce serveur.",
    configLabelCommandChannel: "Salon de commande",
    configLabelForumChannel: "Forum",
    configLabelJobName: "Nom du metier",
    configLabelLanguage: "Langue",
    configLabelRankRoles: "Roles de rang",
    configNotSet: "Non defini",
    configAllRolesAllowed: "Tous les roles du serveur",
    configCommandChannelSaved: ({ channel }) =>
      `Le salon de commande a ete defini sur ${channel}.`,
    configForumChannelSaved: ({ channel }) =>
      `Le forum a ete defini sur ${channel}.`,
    configJobNameSaved: ({ value }) =>
      `Le nom du metier a ete defini sur **${value}**.`,
    configLanguageSaved: ({ languageLabel }) =>
      `La langue du bot a ete definie sur **${languageLabel}**.`,
    configRankRoleAddSaved: ({ role }) =>
      `Le role ${role} a ete ajoute a la liste des rangs autorises.`,
    configRankRoleRemoveSaved: ({ role }) =>
      `Le role ${role} a ete retire de la liste des rangs autorises.`,
    configRankRoleAlreadyPresent: ({ role }) =>
      `Le role ${role} est deja dans la liste des rangs autorises.`,
    configRankRoleNotPresent: ({ role }) =>
      `Le role ${role} n'est pas dans la liste des rangs autorises.`,
    configRankRoleListEmpty:
      "Aucun role n'est configure. Le bot utilise tous les roles du serveur.",
    configRankRoleListTitle: "**Roles pris en compte pour les rangs**",
    configRankRoleClearSaved:
      "La liste des roles de rang a ete videe. Le bot utilisera a nouveau tous les roles du serveur.",
    configRankRoleAddDescription:
      "Ajoute un role a la liste des rangs autorises.",
    configRankRoleRemoveDescription:
      "Retire un role de la liste des rangs autorises.",
    configRankRoleListDescription:
      "Affiche les roles actuellement pris en compte pour les rangs.",
    configRankRoleClearDescription:
      "Vide la liste des roles de rang configures.",
    configRankRoleOptionDescription: "Role a prendre en compte pour les rangs",
    configForumNotConfigured:
      "Aucun forum n'est configure sur ce serveur pour le moment.",
    configWipeForumConfirmationInvalid:
      "Confirmation invalide. Tapez **CONFIRMER** pour lancer le wipe du forum.",
    configWipeForumStarted:
      "Wipe du forum en cours. Suppression de tous les posts...",
    configWipeForumCompleted: ({ deletedCount, failedCount }) =>
      `Wipe termine. ${deletedCount} post(s) supprime(s)${
        failedCount > 0 ? `, ${failedCount} en echec` : ""
      }.`,
    languageLabelFr: "Francais",
    languageLabelEn: "Anglais",
    serviceCommandDescription: "Gere les prises de service.",
    serviceStartDescription: "Demarre votre session de service.",
    serviceStopDescription: "Termine votre session de service en cours.",
    serviceStatusDescription: "Affiche votre statut de service actuel.",
    serviceAlreadyOnDuty: ({ since }) =>
      `Vous etes deja en service depuis ${since}.`,
    serviceStarted: ({ displayName, startedAt }) =>
      `\u{1F7E2} **${displayName}** a pris son service a ${startedAt}.`,
    serviceNoActiveSession: "Vous n'avez aucune session de service active.",
    serviceStopped: ({ displayName, endedAt, duration }) =>
      `\u{1F534} **${displayName}** a termine son service a ${endedAt} apres ${duration}.`,
    statusLabel: "Statut",
    statusOnDuty: "\u{1F7E2} En service",
    statusOffDuty: "\u{1F534} Hors service",
    currentSessionLabel: "Session actuelle",
    currentSessionStarted: ({ startedAt }) => `Commencee ${startedAt}`,
    currentSessionNone: "Aucune session active",
    totalTimeLabel: "Temps total",
    activeAgentsTitle: "Agents en service",
    activeAgentsEmpty: "Aucun agent n'est actuellement en service.",
    activeAgentsCount: ({ count }) => `${count} agent(s) en service`,
    activeAgentsStartedAt: ({ startedAt }) => `Depuis ${startedAt}`,
    leaderboardCommandDescription:
      "Affiche le classement des temps de service du serveur.",
    leaderboardEmpty: "Aucune donnee de service n'a encore ete enregistree.",
    leaderboardTitle: "**Classement de service**",
    forumInvalidChannel:
      "Le forum configure est invalide ou n'existe plus.",
    forumInitMessage: "Initialisation du profil en cours...",
    forumAgentLabel: "Agent",
    forumRankLabel: "Rang",
    forumJobLabel: "Metier",
    forumStatusLabel: "Statut",
    forumTotalTimeLabel: "Temps total",
    forumActiveSessionLabel: "Session active",
    forumActiveSessionStarted: ({ startedAt }) => `Commencee ${startedAt}`,
    forumActiveSessionNone: "Aucune",
    forumRankNone: "Aucun rang",
    forumSessionHistoryLine: ({ startedAt, endedAt, duration }) =>
      `- ${startedAt} -> ${endedAt} (${duration})`,
    forumRecentSessionsTitle: "**Sessions recentes**",
    forumNoCompletedSessions: "- Aucune session terminee pour le moment.",
    commandGuideTitle: "Commandes de service",
    commandGuideDescription:
      "Utilisez les commandes ci-dessous dans ce salon pour gerer votre prise de service.",
    commandGuideJobField: "Metier",
    commandGuideStartField: "/service start",
    commandGuideStartValue: "Prendre son service",
    commandGuideStopField: "/service stop",
    commandGuideStopValue: "Terminer son service",
    commandGuideStatusField: "/service status",
    commandGuideStatusValue: "Voir les agents actuellement en service",
    commandGuideLeaderboardField: "/leaderboard",
    commandGuideLeaderboardValue: "Voir le classement des temps de service",
    commandGuideFooter:
      "Utilisez ces commandes dans ce salon pour votre service RP.",
    commandChannelOnly:
      "Cette commande peut uniquement etre utilisee dans le salon configure."
  },
  en: {
    configCommandDescription: "Configure the service bot for this server.",
    configChannelSubcommandDescription:
      "Set the allowed channel for service commands.",
    configChannelOptionDescription: "Text channel for service commands",
    configForumSubcommandDescription:
      "Set the forum used for user profiles.",
    configForumOptionDescription: "Forum used for service profiles",
    configJobNameSubcommandDescription:
      "Set the RP job name displayed on profiles.",
    configJobNameOptionDescription: "RP job name",
    configLanguageSubcommandDescription: "Set the language used by the bot.",
    configLanguageOptionDescription: "Language for bot messages",
    configWipeForumSubcommandDescription:
      "Delete every post in the configured forum.",
    configWipeForumOptionDescription:
      "Type CONFIRM to validate the forum wipe",
    configShowSubcommandDescription: "Show the current configuration.",
    configShowEmpty: "No configuration has been saved for this server yet.",
    configLabelCommandChannel: "Command channel",
    configLabelForumChannel: "Forum channel",
    configLabelJobName: "Job name",
    configLabelLanguage: "Language",
    configLabelRankRoles: "Rank roles",
    configNotSet: "Not set",
    configAllRolesAllowed: "All server roles",
    configCommandChannelSaved: ({ channel }) =>
      `Command channel set to ${channel}.`,
    configForumChannelSaved: ({ channel }) => `Forum channel set to ${channel}.`,
    configJobNameSaved: ({ value }) => `Job name set to **${value}**.`,
    configLanguageSaved: ({ languageLabel }) =>
      `Bot language set to **${languageLabel}**.`,
    configRankRoleAddSaved: ({ role }) =>
      `Role ${role} was added to the allowed rank-role list.`,
    configRankRoleRemoveSaved: ({ role }) =>
      `Role ${role} was removed from the allowed rank-role list.`,
    configRankRoleAlreadyPresent: ({ role }) =>
      `Role ${role} is already in the allowed rank-role list.`,
    configRankRoleNotPresent: ({ role }) =>
      `Role ${role} is not in the allowed rank-role list.`,
    configRankRoleListEmpty:
      "No role is configured. The bot currently uses every server role.",
    configRankRoleListTitle: "**Roles considered for ranks**",
    configRankRoleClearSaved:
      "The rank-role list was cleared. The bot will use every server role again.",
    configRankRoleAddDescription:
      "Add a role to the allowed rank-role list.",
    configRankRoleRemoveDescription:
      "Remove a role from the allowed rank-role list.",
    configRankRoleListDescription:
      "Show the roles currently used for ranks.",
    configRankRoleClearDescription:
      "Clear the configured rank-role list.",
    configRankRoleOptionDescription: "Role used for ranks",
    configForumNotConfigured:
      "No forum channel is configured for this server yet.",
    configWipeForumConfirmationInvalid:
      "Invalid confirmation. Type **CONFIRM** to start the forum wipe.",
    configWipeForumStarted:
      "Forum wipe started. Deleting every post now...",
    configWipeForumCompleted: ({ deletedCount, failedCount }) =>
      `Wipe completed. ${deletedCount} post(s) deleted${
        failedCount > 0 ? `, ${failedCount} failed` : ""
      }.`,
    languageLabelFr: "French",
    languageLabelEn: "English",
    serviceCommandDescription: "Manage on-duty service sessions.",
    serviceStartDescription: "Start your service session.",
    serviceStopDescription: "Stop your current service session.",
    serviceStatusDescription: "Show your current service status.",
    serviceAlreadyOnDuty: ({ since }) =>
      `You are already on duty since ${since}.`,
    serviceStarted: ({ displayName, startedAt }) =>
      `\u{1F7E2} **${displayName}** started service at ${startedAt}.`,
    serviceNoActiveSession: "You do not have any active service session.",
    serviceStopped: ({ displayName, endedAt, duration }) =>
      `\u{1F534} **${displayName}** finished service at ${endedAt} after ${duration}.`,
    statusLabel: "Status",
    statusOnDuty: "\u{1F7E2} On duty",
    statusOffDuty: "\u{1F534} Off duty",
    currentSessionLabel: "Current session",
    currentSessionStarted: ({ startedAt }) => `Started ${startedAt}`,
    currentSessionNone: "No active session",
    totalTimeLabel: "Total time",
    activeAgentsTitle: "Agents on duty",
    activeAgentsEmpty: "No agent is currently on duty.",
    activeAgentsCount: ({ count }) => `${count} agent(s) on duty`,
    activeAgentsStartedAt: ({ startedAt }) => `Since ${startedAt}`,
    leaderboardCommandDescription:
      "Show the top service times for this server.",
    leaderboardEmpty: "No service data recorded yet.",
    leaderboardTitle: "**Service leaderboard**",
    forumInvalidChannel:
      "Configured forum channel is invalid or no longer exists.",
    forumInitMessage: "Profile initialization in progress...",
    forumAgentLabel: "Agent",
    forumRankLabel: "Rank",
    forumJobLabel: "Job",
    forumStatusLabel: "Status",
    forumTotalTimeLabel: "Total time",
    forumActiveSessionLabel: "Active session",
    forumActiveSessionStarted: ({ startedAt }) => `Started ${startedAt}`,
    forumActiveSessionNone: "None",
    forumRankNone: "No rank",
    forumSessionHistoryLine: ({ startedAt, endedAt, duration }) =>
      `- ${startedAt} -> ${endedAt} (${duration})`,
    forumRecentSessionsTitle: "**Recent sessions**",
    forumNoCompletedSessions: "- No completed sessions yet.",
    commandGuideTitle: "Service commands",
    commandGuideDescription:
      "Use the commands below in this channel to manage your service sessions.",
    commandGuideJobField: "Job",
    commandGuideStartField: "/service start",
    commandGuideStartValue: "Start your service session",
    commandGuideStopField: "/service stop",
    commandGuideStopValue: "End your service session",
    commandGuideStatusField: "/service status",
    commandGuideStatusValue: "View the agents currently on duty",
    commandGuideLeaderboardField: "/leaderboard",
    commandGuideLeaderboardValue: "View the service time leaderboard",
    commandGuideFooter:
      "Use these commands in this channel for your RP service flow.",
    commandChannelOnly:
      "This command can only be used in the configured channel."
  }
};

function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
}

function getGuildLanguage(config) {
  return normalizeLanguage(config?.language);
}

function getLanguageLabel(language, viewerLanguage = DEFAULT_LANGUAGE) {
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedViewerLanguage = normalizeLanguage(viewerLanguage);
  const key = normalizedLanguage === "fr" ? "languageLabelFr" : "languageLabelEn";
  return translations[normalizedViewerLanguage][key];
}

function getWipeConfirmationKeyword(language) {
  return normalizeLanguage(language) === "fr" ? "CONFIRMER" : "CONFIRM";
}

function isValidWipeConfirmation(language, value) {
  const normalizedValue = String(value || "").trim().toUpperCase();
  return normalizedValue === getWipeConfirmationKeyword(language)
    || normalizedValue === getWipeConfirmationKeyword(DEFAULT_LANGUAGE)
    || normalizedValue === getWipeConfirmationKeyword("en");
}

function t(language, key, params = {}) {
  const normalizedLanguage = normalizeLanguage(language);
  const entry = translations[normalizedLanguage][key] ?? translations.fr[key];

  if (typeof entry === "function") {
    return entry(params);
  }

  return entry ?? key;
}

module.exports = {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getGuildLanguage,
  getLanguageLabel,
  getWipeConfirmationKeyword,
  isValidWipeConfirmation,
  normalizeLanguage,
  t
};
