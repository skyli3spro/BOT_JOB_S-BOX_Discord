# BOT_JOB_S-BOX_Discord

Bot Discord de suivi de service pour serveurs RP S&box.

English version: [README.md](README.md)

## Fonctionnalites

- `/service start`
- `/service stop`
- `/service status`
- `/leaderboard`
- `/config command-channel`
- `/config forum-channel`
- `/config job-name`
- `/config language`
- `/config rank-role-add`
- `/config rank-role-remove`
- `/config rank-role-list`
- `/config rank-role-clear`
- `/config wipe-forum`
- `/config show`

## Stack

- Node.js
- discord.js
- SQLite
- `node:sqlite` (module natif de Node.js)

## Installation

1. Copier `.env.example` vers `.env`
2. Renseigner le token du bot, le client ID de l'application et eventuellement `TEST_GUILD_IDS`
3. Installer les dependances avec `npm install`
4. Enregistrer les slash commands avec `npm run register`
5. Lancer le bot avec `npm start`

Important :
- `TEST_GUILD_IDS` est optionnel
- tu en as besoin uniquement si tu veux des mises a jour rapides des commandes sur un ou plusieurs serveurs de test
- si tu le laisses vide, le bot peut quand meme fonctionner sur tous les serveurs ou il est invite

## Configuration du `.env`

Exemple :

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_client_id
TEST_GUILD_IDS=your_first_test_guild_id,your_second_test_guild_id
DATABASE_PATH=./data/service-tracker.db
```

### `DISCORD_TOKEN`

Role :
Token prive du bot utilise pour connecter le bot a Discord.

Ou le trouver :
1. Ouvrir le [Discord Developer Portal](https://discord.com/developers/applications)
2. Ouvrir ton application
3. Aller dans `Bot`
4. Cliquer sur `Reset Token` ou `Copy`

Important :
- ne jamais partager ce token
- ne jamais le poster dans Discord ou sur GitHub
- s'il fuit, il faut le regenerer immediatement

### `DISCORD_CLIENT_ID`

Role :
Identifiant public de l'application utilise pour enregistrer les slash commands et creer le lien d'invitation du bot.

Ou le trouver :
1. Ouvrir le [Discord Developer Portal](https://discord.com/developers/applications)
2. Ouvrir ton application
3. Aller dans `General Information`
4. Copier `Application ID`

### `TEST_GUILD_IDS`

Role :
Liste d'identifiants de serveurs Discord de test, separes par des virgules, utilises pour enregistrer les slash commands sur plusieurs serveurs precis.

Est-ce obligatoire ?
- non, cette variable est optionnelle
- utilise-la seulement pendant le developpement ou les tests
- si tu ne la renseignes pas, les commandes seront enregistrees globalement pour tous les serveurs ou le bot est invite

Ou le trouver :
1. Activer le `Developer Mode` dans Discord
2. Aller dans `User Settings > Advanced`
3. Activer `Developer Mode`
4. Clic droit sur le serveur cible
5. Cliquer sur `Copy Server ID`

### `DATABASE_PATH`

Role :
Chemin vers la base SQLite locale utilisee par le bot.

Valeur recommandee :
`./data/service-tracker.db`

## Commandes

### `/service start`

Demarre une session de service pour l'utilisateur.

Exemple :
`/service start`

### `/service stop`

Termine la session de service en cours.

Exemple :
`/service stop`

### `/service status`

Affiche le statut actuel de l'utilisateur.

Exemple :
`/service status`

### `/leaderboard`

Affiche les utilisateurs avec le plus de temps de service.

Exemple :
`/leaderboard`

### `/config command-channel`

Definit le salon autorise pour les commandes de service.

Exemple :
`/config command-channel channel:#service`

### `/config forum-channel`

Definit le forum Discord utilise pour les profils utilisateurs.

Exemple :
`/config forum-channel channel:#service-profils`

### `/config job-name`

Definit le nom du metier RP affiche dans les profils.

Exemple :
`/config job-name value:Police`

### `/config language`

Definit la langue utilisee par le bot pour les messages et le contenu du forum.

Exemple :
`/config language value:fr`

Notes :
- le bot est en anglais par defaut
- la traduction francaise reste disponible avec cette commande

## Utilisation multi-serveur

Une seule instance du bot peut fonctionner sur plusieurs serveurs Discord en meme temps.

- invite le meme bot sur tous les serveurs voulus
- chaque serveur garde sa propre configuration et ses propres donnees via son `guild_id`
- pour le developpement rapide, renseigne `TEST_GUILD_IDS` avec un ou plusieurs IDs de serveurs separes par des virgules
- si tu veux rendre les commandes disponibles partout sans lister les serveurs, laisse `TEST_GUILD_IDS` vide pour un enregistrement global
- tu n'as pas besoin de lancer plusieurs instances du bot juste parce que tu utilises plusieurs serveurs Discord

### `/config rank-role-add`

Ajoute un role a la liste des roles autorises pour le rang.

Exemple :
`/config rank-role-add role:@Brigadier`

### `/config rank-role-remove`

Retire un role de la liste des roles autorises pour le rang.

Exemple :
`/config rank-role-remove role:@Brigadier`

### `/config rank-role-list`

Affiche les roles actuellement pris en compte pour le rang.

Exemple :
`/config rank-role-list`

### `/config rank-role-clear`

Vide la liste des roles de rang configures.

Exemple :
`/config rank-role-clear`

### `/config wipe-forum`

Supprime tous les posts du forum configure et nettoie les liens de threads enregistres.

Exemple :
`/config wipe-forum confirmation:CONFIRM`

### `/config show`

Affiche la configuration actuelle du serveur.

Exemple :
`/config show`

## Notes

- les commandes de service peuvent etre limitees a un salon dedie via `/config command-channel`
- les profils utilisateurs peuvent etre postes dans un forum Discord via `/config forum-channel`
- le bot est en anglais par defaut et peut etre passe en francais via `/config language`
- les reponses publiques du bot sont supprimees automatiquement apres 1 minute
- la base SQLite est stockee dans `./data/service-tracker.db`
- le projet cible Node.js 22+ pour utiliser `node:sqlite`
