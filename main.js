const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// === ENV VARIABLES — set these in Render/GitHub Secrets ===
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BOT_OWNER_ID = process.env.DISCORD_OWNER_ID; // your Discord User ID

if (!TOKEN || !CLIENT_ID || !BOT_OWNER_ID) {
  console.error('❌ Missing env variables! Check DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_OWNER_ID');
  process.exit(1);
}

// === BOT SETUP ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// === LOAD ALL COMMANDS ===
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
      }
    } catch (e) {
      console.error(`❌ Failed to load ${file}:`, e);
    }
  }
}

// === BOT READY ===
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commandJSON = [...client.commands.values()].map(c => c.data.toJSON());

  try {
    console.log('🔄 Registering commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandJSON });
    console.log('✅ Commands registered globally');
  } catch (e) {
    console.error('❌ Failed to register commands:', e);
  }
});

// === COMMAND HANDLER + OWNER CHECK ===
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  // 🔒 Owner-only block
  if (cmd.ownerOnly && interaction.user.id !== BOT_OWNER_ID) {
    return interaction.reply({
      content: '❌ Only the bot owner can use this command.',
      ephemeral: true
    });
  }

  try {
    await cmd.execute(interaction, client);
  } catch (e) {
    console.error(`Error in /${interaction.commandName}:`, e);
    if (!interaction.replied) {
      interaction.reply({ content: '❌ Something went wrong.', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(TOKEN);
