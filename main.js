require('./keepalive.js');

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load from Render Secrets
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

// 🔍 DEBUG — tell us if secrets are loading
console.log('🔑 Token loaded:', !!TOKEN);
console.log('🆔 Client ID loaded:', !!CLIENT_ID);

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in Environment Variables!');
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

// 📂 Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  console.log(`📂 Found ${commandFiles.length} command files`);

  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if ('data' in cmd && 'execute' in cmd) {
        client.commands.set(cmd.data.name, cmd);
        console.log(`✅ Loaded: ${cmd.data.name}`);
      } else {
        console.log(`⚠️ Skipped: ${file} — missing data/execute`);
      }
    } catch (e) {
      console.error(`❌ Error loading ${file}:`, e.message);
    }
  }
} else {
  console.error('❌ /commands folder not found!');
}

// 🚀 Ready
client.once('ready', async () => {
  console.log(`✅ LOGGED IN AS: ${client.user.tag}`);
  console.log(`📦 Total commands: ${client.commands.size}`);

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: client.commands.map(c => c.data.toJSON()) }
    );
    console.log('✅ Commands registered! (May take ~1hr to show everywhere)');
  } catch (e) {
    console.error('❌ Failed to register commands:', e);
  }
});

// ⚡ Run commands
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

// 🔐 Login with error feedback
console.log('🔐 Attempting to log in...');
client.login(TOKEN)
  .then(() => console.log('✅ Login promise resolved!'))
  .catch(err => {
    console.error('❌ LOGIN FAILED:', err.message);
    process.exit(1);
  });
