require('./keepalive.js');

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load from Secrets / environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in Secrets!');
  process.exit(1);
}

// Bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// 📂 AUTO-LOAD ALL COMMANDS FROM /commands FOLDER
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  
  for (const file of commandFiles) {
    const cmd = require(path.join(commandsPath, file));
    if ('data' in cmd && 'execute' in cmd) {
      client.commands.set(cmd.data.name, cmd);
      console.log(`✅ Loaded: ${cmd.data.name}`);
    } else {
      console.log(`⚠️ Skipped: ${file} — missing data/execute`);
    }
  }
} else {
  console.log('❌ /commands folder not found!');
}

// 🚀 Ready & Register Commands
client.once('ready', async () => {
  console.log(`\n✅ Logged in as: ${client.user.tag}`);
  console.log(`📦 Commands loaded: ${client.commands.size}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: client.commands.map(c => c.data.toJSON()) }
    );
    console.log('✅ Commands registered globally!\n(May take up to 1 hour to show everywhere)');
  } catch (e) {
    console.error('❌ Failed to register commands:', e);
  }
});

// ⚡ Run Commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (e) {
    console.error(`/${interaction.commandName}:`, e);
    interaction.reply({ content: '❌ Error running command', ephemeral: true }).catch(() => {});
  }
});

client.login(TOKEN);
