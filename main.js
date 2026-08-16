const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BOT_OWNER_ID = process.env.DISCORD_OWNER_ID;

if (!TOKEN || !CLIENT_ID || !BOT_OWNER_ID) {
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
  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
      }
    } catch (e) {
      console.error(`❌ Load error: ${file}`, e);
    }
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const cmds = [...client.commands.values()].map(c => c.data.toJSON());

  try {
    console.log('🔄 Registering commands...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: cmds });
    console.log('✅ Commands registered');
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
    interaction.reply({ content: '❌ Error.', ephemeral: true }).catch(() => {});
  }
});

client.login(TOKEN);
