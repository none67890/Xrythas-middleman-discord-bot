const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

require('./keepalive.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BOT_OWNER_ID = process.env.DISCORD_OWNER_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // ← ADD THIS IN RENDER SECRETS

if (!TOKEN || !CLIENT_ID || !BOT_OWNER_ID || !GUILD_ID) {
  console.error('❌ Missing env variables!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  console.log('📂 Found command files:', commandFiles);
  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
        console.log('✅ Loaded:', cmd.data.name);
      }
    } catch (e) {
      console.error('❌ Load error:', file, e.message);
    }
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in: ${client.user.tag}`);
  console.log('📊 Total commands loaded:', client.commands.size);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const cmds = [...client.commands.values()].map(c => c.data.toJSON());

  try {
    console.log('🔄 Registering GUILD commands...');
    // ↓ THIS IS THE KEY CHANGE — GUILD NOT GLOBAL ↓
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: cmds }
    );
    console.log('✅ GUILD Commands Registered — check NOW!');
  } catch (e) {
    console.error('❌ Register error:', e);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  if (cmd.ownerOnly && interaction.user.id !== BOT_OWNER_ID) {
    return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
  }

  try {
    await cmd.execute(interaction, client);
  } catch (e) {
    console.error(e);
    if (!interaction.replied) {
      interaction.reply({ content: '❌ Error.', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(TOKEN);
