const { Client, GatewayIntentBits, Collection, REST, Routes, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

require('./keepalive.js');

// ✅ All from Render Secrets — nothing hardcoded!
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const BOT_OWNER_ID = process.env.DISCORD_OWNER_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const MIDDLEMAN_ROLES = [
  process.env.MM_ROLE_1,
  process.env.MM_ROLE_2,
  process.env.MM_ROLE_3,
  process.env.MM_ROLE_4
];

// Boost channel ID — already filled in!
const BOOST_CHANNEL_ID = '1537576010436968628';

if (!TOKEN || !CLIENT_ID || !BOT_OWNER_ID || !GUILD_ID) {
  console.error('❌ Missing required Discord environment variables!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
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
      console.error('❌ Error loading', file, ':', e.message);
    }
  }
}

// ─── Ready ───
client.once('ready', async () => {
  console.log(`✅ Logged in: ${client.user.tag}`);
  console.log('🎟️ Xrytha\'s Middleman Bot — Online');
  console.log('📊 Commands loaded:', client.commands.size);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const cmds = [...client.commands.values()].map(c => c.data.toJSON());

  try {
    console.log('🔄 Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: cmds }
    );
    console.log('✅ Commands registered!');
  } catch (e) {
    console.error('❌ Command register error:', e);
  }
});

// ─── Interaction Handler ───
client.on('interactionCreate', async interaction => {
  // Slash Commands
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    if (cmd.ownerOnly && interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    }

    try {
      await cmd.execute(interaction, client);
    } catch (e) {
      console.error('Command error:', e);
      if (!interaction.replied) {
        interaction.reply({ content: '❌ Something went wrong.', ephemeral: true }).catch(() => {});
      }
    }
  }

  // ─── BUTTON: Open Ticket Form ───
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
      .setPlaceholder('Found on your Roblox profile URL')
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

  // ─── BUTTON: Show Rules ───
  if (interaction.isButton() && interaction.customId === 'mm_rules') {
    const rulesEmbed = new EmbedBuilder()
      .setTitle('📜 Xrytha\'s Middleman Rules')
      .setColor('#9932CC')
      .setDescription(
        '• Never go first — middleman protects both sides\n' +
        '• No DMs — all trades in tickets only\n' +
        '• No passwords or 2FA codes — ever\n' +
        '• Screenshots of everything\n' +
        '• Be patient — wait for staff to claim\n' +
        '• Use `/vouch` after trade in #vouches channel\n' +
        '• Anyone DMing you first = SCAMMER'
      );
    return interaction.reply({ embeds: [rulesEmbed], ephemeral: true });
  }

  // ─── BUTTON: Vouches Info ───
  if (interaction.isButton() && interaction.customId === 'mm_vouches') {
    return interaction.reply({
      content: '⭐ **How to leave a vouch:**\n• Go to #vouches channel\n• Positive: `/vouch @User positive`\n• Negative: `/vouch @User negative [reason]`\n\nThank you for trading with us! 💜',
      ephemeral: true
    });
  }

  // ─── MODAL SUBMIT → Create Ticket ───
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
      return interaction.reply({ content: `❌ You already have a ticket open: ${existing}`, ephemeral: true });
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

    // Add all middleman roles (skip empty ones)
    for (const roleId of MIDDLEMAN_ROLES) {
      if (!roleId) continue;
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

    // Welcome embed in ticket
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('🎟️ Middleman Ticket — Trade Details')
      .setColor('#9932CC')
      .addFields(
        { name: '📤 Trading', value: `**${item}**`, inline: false },
        { name: '💰 Value', value: value, inline: true },
        { name: '🆔 Your Roblox ID', value: `\`${yourId}\``, inline: true },
        { name: '🤝 Trading With', value: partner, inline: false },
        { name: '📝 Extra Notes', value: extra }
      )
      .setDescription(
        `Welcome <@${interaction.user.id}>!\n\n` +
        '✅ **Your trade details have been recorded.**\n' +
        'A verified middleman will claim this ticket shortly.\n\n' +
        '⚠️ **Do NOT send anything until told by a middleman.**\n' +
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

  // ─── Close Ticket ───
  if (interaction.isButton() && interaction.customId === 'mm_close_ticket') {
    await interaction.reply({ content: '🔒 Closing ticket in 3 seconds...', ephemeral: true });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
  }

  // ─── Claim Ticket ───
  if (interaction.isButton() && interaction.customId === 'mm_claim_ticket') {
    const hasRole = MIDDLEMAN_ROLES.some(r => r && interaction.member.roles.cache.has(r));
    if (!hasRole) {
      return interaction.reply({ content: '❌ Only middleman staff can claim tickets!', ephemeral: true });
    }

    await interaction.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('✅ Ticket Claimed')
        .setColor('#2ECC71')
        .setDescription(`This ticket is now being handled by <@${interaction.user.id}>.`)
        .setTimestamp()
      ]
    });
    await interaction.update({ components: [] }).catch(() => {});
  }
});

// ─── BOOST ANNOUNCEMENT SYSTEM ───
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (!oldMember.premiumSince && newMember.premiumSince) {
    const channel = newMember.guild.channels.cache.get(BOOST_CHANNEL_ID);
    if (!channel) return;

    const boostEmbed = new EmbedBuilder()
      .setTitle('🚀 SERVER BOOSTED!')
      .setColor('#F472B6')
      .setThumbnail(newMember.user.displayAvatarURL({ size: 256 }))
      .setDescription(
        `Thank you so much <@${newMember.id}> for boosting the server!\n\n` +
        '💜 We appreciate your support!\n' +
        'Enjoy your perks! 🎉'
      )
      .addFields(
        { name: '👤 Booster', value: `<@${newMember.user.id}>`, inline: true },
        { name: '📅 Boosting since', value: `<t:${Math.floor(newMember.premiumSince.getTime() / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Xrytha\'s Middleman Service • Thank you for boosting!' })
      .setTimestamp();

    await channel.send({ content: `<@${newMember.id}> THANK YOU! 🚀`, embeds: [boostEmbed] });
  }
});

client.login(TOKEN);
