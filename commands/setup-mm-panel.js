const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const BOT_OWNER_ID = '1491469471775457290';

// Your video link — already filled in!
const VIDEO_LINK = 'https://cdn.discordapp.com/attachments/1537578077821870210/1539023077197877298/copy_5F7D1781-4276-404E-A57C-A6C7DD6F6945.mov?ex=6a84ce6f&is=6a837cef&hm=f97168a40bdcfb8e181f043852a4ccfc0ad6667cd4b12a375ec016f38bdde58a&';

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

    // ✅ Video link in message content — Discord auto-plays it!
    await interaction.channel.send({
      content: `🎬 **Service Overview:**\n${VIDEO_LINK}`,
      embeds: [embed],
      components: [buttons]
    });

    await interaction.reply({ content: '✅ Middleman setup message sent!', ephemeral: true });
  }
};
