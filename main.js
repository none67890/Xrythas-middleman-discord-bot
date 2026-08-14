const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BOT_NAME = "Xrytha’s Middleman";

// Check secrets first
if (!TOKEN || !CLIENT_ID) {
  console.error(`❌ [${BOT_NAME}] Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in Environment Variables!`);
  process.exit(1);
}

// Create bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  console.log(`📂 [${BOT_NAME}] Found ${commandFiles.length} command file(s)`);
  
  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
        console.log(`✅ [${BOT_NAME}] Loaded: ${cmd.data.name}`);
      }
    } catch (err) {
      console.error(`❌ [${BOT_NAME}] Failed ${file}:`, err.message);
    }
  }
} else {
  console.log(`⚠️ [${BOT_NAME}] /commands folder not found`);
}

// Handle commands, buttons, modals
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction, client);
    } catch (err) {
      console.error(`❌ [${BOT_NAME}] /${interaction.commandName}:`, err.message);
      await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true }).catch(() => {});
    }
  }

  // Buttons (for verify system)
  else if (interaction.isButton()) {
    const verifyCmd = client.commands.get('verify');
    if (verifyCmd?.buttonHandler) {
      try { await verifyCmd.buttonHandler(interaction); }
      catch (err) { console.error(`❌ [${BOT_NAME}] Button:`, err.message); }
    }
  }

  // Modals (for verify system)
  else if (interaction.isModalSubmit()) {
    const verifyCmd = client.commands.get('verify');
    if (verifyCmd?.modalHandler) {
      try { await verifyCmd.modalHandler(interaction); }
      catch (err) { console.error(`❌ [${BOT_NAME}] Modal:`, err.message); }
    }
  }
});

// Ready & register commands
client.once('ready', async () => {
  console.log(`✅ [${BOT_NAME}] ONLINE — Logged in as: ${client.user.tag}`);
  
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    const cmds = [...client.commands.values()].map(c => c.data.toJSON());
    console.log(`🔄 [${BOT_NAME}] Registering ${cmds.length} commands...`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: cmds });
    console.log(`✅ [${BOT_NAME}] Commands registered!`);
  } catch (err) {
    console.error(`❌ [${BOT_NAME}] Register failed:`, err.message);
  }
});

// Keep-alive server
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send(`✅ ${BOT_NAME} — Trusted Middleman Service`));
app.listen(PORT, () => console.log(`✅ [${BOT_NAME}] Keep-alive on port ${PORT}`));

// Login with TIMEOUT — will tell us exactly what's wrong!
console.log(`🔐 [${BOT_NAME}] Connecting to Discord...`);

const loginTimeout = setTimeout(() => {
  console.error('⏰ [${BOT_NAME}] TIMEOUT after 35s — Discord not responding');
  console.error('👉 Check: Privileged Intents ON? Token correct? Render IP blocked?');
  process.exit(1);
}, 35000);

client.login(TOKEN)
  .then(() => {
    clearTimeout(loginTimeout);
    console.log(`✅ [${BOT_NAME}] LOGIN SUCCESSFUL!`);
  })
  .catch(err => {
    clearTimeout(loginTimeout);
    console.error(`❌ [${BOT_NAME}] LOGIN FAILED:`, err.message);
    process.exit(1);
  });
