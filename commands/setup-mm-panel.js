const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const BOT_OWNER_ID = '1491469471775457290';

module.exports = {
  ownerOnly: true,
  data: new SlashCommandBuilder()
    .setName('setuppanel')
    .setDescription('🔒 Send Xrytha\'s Middleman Service panel'),

  async execute(interaction) {
    if (interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: '❌ Only the owner can use this command.', ephemeral: true });
    }

    const panelEmbed = new EmbedBuilder()
      .setTitle('🛡️ **Xrytha\'s Middleman Service**')
      .setColor('#9932CC')
      .setDescription(
        'Your trusted, verified hub for safe trading.\n\n' +
        '🎮 **What We Handle**\n' +
        '• Roblox Accounts • Items • Gamepasses • Robux\n' +
        '• Discord Accounts • Cross-platform trades\n\n' +
        '📋 **How It Works**\n' +
        '1. Click **Open Ticket** below\n' +
        '2. Fill in your trade details\n' +
        '3. Wait for a middleman to claim\n' +
        '4. Trade safely — never go first!\n\n' +
        '⚠️ **SAFETY WARNING**\n' +
        '• We NEVER ask for passwords or 2FA codes\n' +
        '• Anyone DMing you first = SCAMMER\n' +
        '• All trades happen in tickets only'
      )
      .setFooter({
        text: 'Xrytha\'s Middleman Service • Trust • Transparency • Protection'
      })
      .setTimestamp();

    // ✅ BUTTONS — Verify REMOVED
    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mm_open_modal') // ✅ MATCHES main.js!
        .setLabel('🎟️ Open Ticket')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('mm_rules')
        .setLabel('📜 Rules')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('mm_vouches')
        .setLabel('⭐ Vouches')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({
      embeds: [panelEmbed],
      components: [buttonsRow]
    });

    await interaction.reply({
      content: '✅ Middleman panel sent!',
      ephemeral: true
    });
  }
};
