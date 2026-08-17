const { Client, GatewayIntentBits, Collection, REST, Routes, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Keep bot online
require('./keepalive.js');

// Load secrets from environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BOT_OWNER_ID = process.env.DISCORD_OWNER_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// ✅ TICKET SYSTEM SETUP — ADD THESE IN RENDER SECRETS!
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const MIDDLEMAN_ROLES = [
  process.env.MM_ROLE_1,
  process.env.MM_ROLE_2,
  process.env.MM_ROLE_3,
  process.env.MM_ROLE_4
];

// Check required env vars
if (!TOKEN || !CLIENT_ID || !BOT_OWNER_ID || !GUILD_ID) {
  console.error('❌ Missing Discord env variables!');
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

// ─── Load Commands ───
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

// ─── When Bot Ready ───
client.once('ready', async () => {
  console.log(`✅ Logged in: ${client.user.tag}`);
  console.log('🎟️ Middleman Ticket System Active');
  console.log('📊 Total commands loaded:', client.commands.size);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const cmds = [...client.commands.values()].map(c => c.data.toJSON());

  try {
    console.log('🔄 Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: cmds }
    );
    console.log('✅ Commands Registered — check your server!');
  } catch (e) {
    console.error('❌ Register error:', e);
  }
});

// ─── Slash Command Handler ───
client.on('interactionCreate', async interaction => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
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
        interaction.reply({ content: '❌ Error running command.', ephemeral: true }).catch(() => {});
      }
    }
  }

  // ─── BUTTON: Open Ticket → Show Modal Form ───
  if (interaction.isButton() && interaction.customId === 'mm_open_modal') {
    const modal = new ModalBuilder()
      .setCustomId('mm_trade_form')
      .setTitle('🎟️ Middleman Trade Request');

    const itemInput = new TextInputBuilder()
      .setCustomId('trade_item')
      .setLabel('What are you trading?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. 1x1x1x1 Secret / 50k Robux')
      .setRequired(true);

    const valueInput = new TextInputBuilder()
      .setCustomId('trade_value')
      .setLabel('Approx value / asking price')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. 10k-20k / 7.2k Robux')
      .setRequired(true);

    const yourIdInput = new TextInputBuilder()
      .setCustomId('your_userid')
      .setLabel('Your Roblox User ID')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Find it on your Roblox profile URL')
      .setRequired(true);

    const partnerInput = new TextInputBuilder()
      .setCustomId('partner_info')
      .setLabel('Trading partner (name + ID)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Username123 (123456789)')
      .setRequired(true);

    const extraInput = new TextInputBuilder()
      .setCustomId('extra_notes')
      .setLabel('Extra info / screenshots (optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(itemInput),
      new ActionRowBuilder().addComponents(valueInput),
      new ActionRowBuilder().addComponents(yourIdInput),
      new ActionRowBuilder().addComponents(partnerInput),
      new ActionRowBuilder().addComponents(extraInput)
    );

    await interaction.showModal(modal);
  }

  // ─── MODAL SUBMITTED → Create Ticket Channel ───
  if (interaction.isModalSubmit() && interaction.customId === 'mm_trade_form') {
    const item = interaction.fields.getTextInputValue('trade_item');
    const value = interaction.fields.getTextInputValue('trade_value');
    const yourId = interaction.fields.getTextInputValue('your_userid');
    const partner = interaction.fields.getTextInputValue('partner_info');
    const extra = interaction.fields.getTextInputValue('extra_notes') || 'None provided';

    // Prevent duplicate tickets
    const existing = interaction.guild.channels.cache.find(
      c => c.name.startsWith('mm-') && c.topic === `user:${interaction.user.id}`
    );
    if (existing) {
      return interaction.reply({ content: `❌ You already have a ticket: ${existing}`, ephemeral: true });
    }

    const category = interaction.guild.channels.cache.get(TICKET_CATEGORY_ID);
    if (!category) {
      return interaction.reply({ content: '❌ Ticket category not set up!', ephemeral: true });
    }

    // Build permissions
    const perms = [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      }
    ];

    // Add all middleman roles
    for (const roleId of MIDDLEMAN_ROLES.filter(Boolean)) {
      perms.push({
        id: roleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageMessages
        ]
      });
    }

    // Create ticket channel
    const ticketCh = await interaction.guild.channels.create({
      name: `mm-${interaction.user.username}`,
      type: 0,
      parent: category.id,
      topic: `user:${interaction.user.id}`,
      permissionOverwrites: perms
    });

    // Welcome embed with their trade info
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('🎟️ **Middleman Ticket — Trade Details**')
      .setColor('#9932CC')
      .addFields(
        { name: '📤 Trading', value: item, inline: false },
        { name: '💰 Value', value: value, inline: true },
        { name: '🆔 Your User ID', value: `\`${yourId}\``, inline: true },
        { name: '🤝 Trading With', value: partner, inline: false },
        { name: '📝 Extra Notes', value: extra }
      )
      .setDescription(
        `Welcome <@${interaction.user.id}>!\n\n` +
        '✅ **Your details have been saved.**\n' +
        'A verified middleman will be with you shortly.\n\n' +
        '⚠️ **Do NOT proceed until told to by a middleman.**\n' +
        '⚠️ Never go first — always wait for instructions.'
      )
      .setFooter({ text: 'Xrytha\'s Middleman Service • Verified & Trusted' })
      .setTimestamp();

    const btns = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mm_close_ticket').setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('mm_claim_ticket').setLabel('✅ Claim Ticket').setStyle(ButtonStyle.Success)
    );

    await ticketCh.send({ embeds: [welcomeEmbed], components: [btns] });
    await interaction.reply({ content: `✅ Ticket created: ${ticketCh}`, ephemeral: true });
  }

  // ─── BUTTON: Close Ticket ───
  if (interaction.isButton() && interaction.customId === 'mm_close_ticket') {
    // Log the closure
    const logCh = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logCh) {
      await logCh.send({
        embeds: [new EmbedBuilder()
          .setTitle('🔒 Ticket Closed')
          .setColor('#E74C3C')
          .addFields(
            { name: 'Channel', value: `\`${interaction.channel.name}\``, inline: true },
            { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp()
        ]
      });
    }
    await interaction.reply({ content: '🔒 Closing ticket in 3 seconds...', ephemeral: true });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
  }

  // ─── BUTTON: Claim Ticket ───
  if (interaction.isButton() && interaction.customId === 'mm_claim_ticket') {
    const hasPermission = MIDDLEMAN_ROLES.some(r => r && interaction.member.roles.cache.has(r));
    if (!hasPermission) {
      return interaction.reply({ content: '❌ Only middleman staff can claim tickets!', ephemeral: true });
    }

    await interaction.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('✅ **Ticket Claimed**')
        .setColor('#2ECC71')
        .setDescription(`This ticket is now being handled by <@${interaction.user.id}>.`)
        .setTimestamp()
      ]
    });
    await interaction.update({ components: [] }).catch(() => {});
  }
});

client.login(TOKEN);
