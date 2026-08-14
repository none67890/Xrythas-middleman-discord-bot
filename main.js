const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Load secrets from environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const BOT_NAME = "Xrytha’s Middleman";

// Create bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Command collection
client.commands = new Collection();

// ------------------------------
// Load all commands from /commands folder
// ------------------------------
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
        console.log(`✅ [${BOT_NAME}] Loaded: ${cmd.data.name}`);
      }
    } catch (err) {
      console.error(`❌ [${BOT_NAME}] Failed to load ${file}:`, err.message);
    }
  }
} else {
  console.log(`⚠️ [${BOT_NAME}] /commands folder not found`);
}

// ------------------------------
// Interaction handler
// ------------------------------
client.on('interactionCreate', async interaction => {
  // Slash commands
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

  // Buttons
  else if (interaction.isButton()) {
    const verifyCmd = client.commands.get('verify');
    if (verifyCmd?.buttonHandler) {
      try {
        await verifyCmd.buttonHandler(interaction);
      } catch (err) {
        console.error(`❌ [${BOT_NAME}] Button error:`, err.message);
      }
    }
  }

  // Modals
  else if (interaction.isModalSubmit()) {
    const verifyCmd = client.commands.get('verify');
    if (verifyCmd?.modalHandler) {
      try {
        await verifyCmd.modalHandler(interaction);
      } catch (err) {
        console.error(`❌ [${BOT_NAME}] Modal error:`, err.message);
      }
    }
  }
});

// ------------------------------
// Ready Event — Register Commands
// ------------------------------
client.once('ready', async () => {
  console.log(`✅ [${BOT_NAME}] LOGGED IN AS: ${client.user.tag}`);
  
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    const commandsJSON = [...client.commands.values()].map(c => c.data.toJSON());
    console.log(`🔄 [${BOT_NAME}] Registering ${commandsJSON.length} commands...`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandsJSON });
    console.log(`✅ [${BOT_NAME}] Commands registered!`);
  } catch (err) {
    console.error(`❌ [${BOT_NAME}] Register failed:`, err.message);
  }
});

// ------------------------------
// Keep-alive server
// ------------------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send(`✅ ${BOT_NAME} — Trusted Middleman Service`));
app.listen(PORT, () => console.log(`✅ [${BOT_NAME}] Keep-alive on port ${PORT}`));

// ------------------------------
// Login
// ------------------------------
console.log(`🔐 [${BOT_NAME}] Connecting...`);
if (!TOKEN || !CLIENT_ID) {
  console.error(`❌ [${BOT_NAME}] Missing DISCORD_TOKEN or DISCORD_CLIENT_ID`);
  process.exit(1);
}

client.login(TOKEN)
  .then(() => console.log(`✅ [${BOT_NAME}] Online!`))
  .catch(err => {
    console.error(`❌ [${BOT_NAME}] Login failed:`, err.message);
    process.exit(1);
  });
