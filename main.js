require('./keepalive.js');

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load secrets from Render Environment Variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

// Debug checks
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

// 📂 Load all commands from /commands folder
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  console.log(`📂 Found ${commandFiles.length} command file(s)`);

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

// 🚀 Ready event
client.once('ready', async () => {
  console.log('✅ BOT IS ONLINE — Logged in as:', client.user.tag);
  console.log(`📦 Total commands loaded: ${client.commands.size}`);

  // Register slash commands globally
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: client.commands.map(c => c.data.toJSON()) }
    );
    console.log('✅ Commands registered! (May take ~1hr to appear everywhere)');
  } catch (e) {
    console.error('❌ Failed to register commands:', e.message);
  }
});

// ⚡ Handle command runs
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (e) {
    console.error(`/${interaction.commandName} error:`, e.message);
    interaction.reply({ content: '❌ Something went wrong running that command.', ephemeral: true }).catch(() => {});
  }
});

// 🔐 Login with timeout + clear errors
console.log('🔐 Attempting to connect to Discord...');

const loginTimeout = setTimeout(() => {
  console.error('⏰ TIMEOUT — No response from Discord after 30 seconds');
  console.error('👉 Check: Privileged Intents ON? Token correct? IP blocked?');
  process.exit(1);
}, 30000);

client.login(TOKEN)
  .then(() => {
    clearTimeout(loginTimeout);
    console.log('✅ Login successful!');
  })
  .catch(err => {
    clearTimeout(loginTimeout);
    console.error('❌ LOGIN FAILED — Error:', err.message);
    process.exit(1);
  });
