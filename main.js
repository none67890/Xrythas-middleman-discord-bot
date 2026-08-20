const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ✅ Keep bot online 24/7
require('./keepalive.js');

// ✅ ALL from Render Secrets — nothing hardcoded
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const OWNER_ID = process.env.DISCORD_OWNER_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
// Add your 4 middleman role IDs in Render Secrets too: MM_ROLE_1, MM_ROLE_2, MM_ROLE_3, MM_ROLE_4
const MM_ROLES = [
  process.env.MM_ROLE_1,
  process.env.MM_ROLE_2,
  process.env.MM_ROLE_3,
  process.env.MM_ROLE_4
].filter(Boolean);

// ⚠️ Validate required secrets
if (!TOKEN || !CLIENT_ID || !GUILD_ID || !OWNER_ID) {
  console.error('❌ Missing secrets! Check Render: DISCORD_TOKEN, CLIENT_ID, GUILD_ID, OWNER_ID');
  process.exit(1);
}

// ✅ Create bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ✅ Auto-load ALL commands from /commands folder
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
        console.log(`✅ Loaded: ${cmd.data.name}`);
      }
    } catch (e) {
      console.error(`❌ Failed to load ${file}:`, e.message);
    }
  }
} else {
  console.warn('⚠️ /commands folder not found — create it!');
}

// ✅ Bot ready + register all slash commands
client.once('ready', async () => {
  console.log(`\n🛡️ XRYTHA'S MIDDLEMAN BOT ONLINE`);
  console.log(`✅ Logged in as: ${client.user.tag}`);
  console.log(`✅ Loaded ${client.commands.size} commands`);
  console.log(`✅ Server: ${GUILD_ID}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commands = [...client.commands.values()].map(c => c.data.toJSON());

  try {
    console.log('\n🔄 Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ All commands registered!');
  } catch (e) {
    console.error('❌ Register error:', e);
  }
});

// ✅ Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.guildId !== GUILD_ID) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (e) {
    console.error(`❌ Command error: ${interaction.commandName}`, e);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true }).catch(() => {});
    }
  }
});

// 🎯 BUTTON HANDLERS — Rules + Open Ticket
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  // 📜 RULES BUTTON — Show ticket rules (ephemeral)
  if (interaction.customId === 'show-ticket-rules') {
    const rulesEmbed = new EmbedBuilder()
      .setTitle('📜 TICKET RULES — Read Before Trading!')
      .setColor('#9932CC')
      .setDescription(`
## 📋 BEFORE YOU OPEN
✅ Both traders must agree — don't open without the other
✅ Know exactly what you're trading — items, value, platform
✅ Be ready to send — don't open if away
✅ NO trust trades — refusing middleman = scam risk

## 🤝 HOW IT WORKS
**1. Open Ticket** → Fill out → wait for middleman
**2. MM Claims** → Confirms both sides & trade details
**3. BOTH Send to MM FIRST** → Wait for both confirmations
**4. MM Releases** → Items sent to each side
**5. BOTH Confirm Received** → Ticket closed

## ⚠️ STRICT RULES
❌ Never go first without middleman
❌ Don't change deal last minute
❌ Keep ALL trade talk in ticket — no DMs
❌ Don't rush or pressure middleman
❌ Be honest about what you're trading
❌ Don't close early — wait for both confirm

## 🚩 RED FLAGS — STOP & REPORT
🔴 "Just go first trust me"
🔴 "Let's do it in DMs faster"
🔴 Asks for money — OUR SERVICE IS FREE!
🔴 Pressures, rushes, or gets angry
🔴 Uses alt without telling you

## 💜 REMINDER
> **Never go first without a middleman. If something feels off — trust your gut.**
      `)
      .setFooter({ text: 'Xrytha\'s Middleman Service • Safe • Fair • Trusted' });

    return interaction.reply({ embeds: [rulesEmbed], ephemeral: true });
  }

  // 🎟️ OPEN TICKET BUTTON — Auto-create ticket channel
  if (interaction.customId === 'open-mm-ticket') {
    const guild = interaction.guild;
    const user = interaction.user;

    if (!TICKET_CATEGORY_ID) {
      return interaction.reply({ content: '❌ Ticket category not set — tell Xrytha!', ephemeral: true });
    }

    try {
      // Build permissions — user + owner + all middleman roles
      const perms = [
        { id: guild.id, deny: ['ViewChannels'] },
        { id: user.id, allow: ['ViewChannels', 'SendMessages', 'ReadMessageHistory'] },
        { id: OWNER_ID, allow: ['ViewChannels', 'SendMessages', 'ManageChannels', 'ManageMessages'] }
      ];
      // Add all middleman roles
      MM_ROLES.forEach(roleId => {
        perms.push({ id: roleId, allow: ['ViewChannels', 'SendMessages', 'ReadMessageHistory'] });
      });

      // Create ticket channel
      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: 0,
        parent: TICKET_CATEGORY_ID,
        permissionOverwrites: perms
      });

      // Welcome embed in ticket
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🛡️ New Trade Ticket')
        .setColor('#9932CC')
        .setDescription(`
Hello ${user}! 👋

**Please reply with:**
• Who are you trading with? @User
• What are you trading? (Item + value)
• Platform? (Roblox, etc.)

✅ A middleman will be with you shortly!
⚠️ **DO NOT send items until a middleman confirms the trade!**
        `)
        .setFooter({ text: 'Xrytha\'s Middleman Service • Safe • Fair • Trusted' });

      await ticketChannel.send({ embeds: [welcomeEmbed] });
      await ticketChannel.send(`<@${user.id}> — Your ticket is ready!`);

      return interaction.reply({
        content: `✅ Your ticket has been created: ${ticketChannel}`,
        ephemeral: true
      });
    } catch (e) {
      console.error('❌ Ticket creation error:', e);
      return interaction.reply({
        content: '❌ Failed to create ticket. Check bot permissions!',
        ephemeral: true
      });
    }
  }
});

// ✅ Login
client.login(TOKEN);
