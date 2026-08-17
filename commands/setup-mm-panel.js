const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const BOT_OWNER_ID = '1491469471775457290';

module.exports = {
  ownerOnly: true,
  data: new SlashCommandBuilder()
    .setName('mm-setup')
    .setDescription('🔒 Setup & send Middleman Service info'),

  async execute(interaction) {
    if (interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🛡️ **Xrytha\'s Middleman Service**')
      .setColor('#9932CC')
      .setDescription(
        'Your trusted, verified hub for safe trading.\n\n' +
        '🎮 **What We Handle**\n' +
        '• Roblox Accounts • Items • Gamepasses • Robux\n' +
        '• Discord Accounts • Cross-platform trades\n\n' +
        '✅ **Why Use Us?**\n' +
        '• Verified & Trusted Staff\n' +
        '• Never go first — we protect both sides\n' +
        '• All trades logged & recorded\n' +
        '• **We NEVER ask for passwords or codes!**\n\n' +
        '⚠️ DMing you first asking for info = SCAMMER. Always verify roles!'
      )
      .setFooter({ text: 'Xrytha\'s Middleman Service • Trust • Transparency • Protection' })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('🎟️ Open Trade Ticket')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('verify_user')
        .setLabel('✅ Verify Account')
        .setStyle(ButtonStyle.Success)
    );

    // ✅ Clean — no video, just embed + buttons
    await interaction.channel.send({
      embeds: [embed],
      components: [buttons]
    });

    await interaction.reply({ content: '✅ Middleman setup sent!', ephemeral: true });
  }
};
