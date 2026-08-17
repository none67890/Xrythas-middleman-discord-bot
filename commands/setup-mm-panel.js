const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const BOT_OWNER_ID = '1491469471775457290';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-mm-panel')
    .setDescription('🔒 [OWNER] Create middleman ticket panel'),

  async execute(interaction) {
    if (interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: '❌ Owner only!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎟️ **Xrytha\'s Middleman Service**')
      .setColor('#9932CC')
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .setDescription(
        '📌 **Start a Middleman Trade**\n\n' +
        'Click the button below to begin. You will be asked for:\n' +
        '• What you are trading\n' +
        '• Roblox User ID(s)\n' +
        '• Who you are trading with\n\n' +
        '🛡️ **SAFETY RULES:**\n' +
        '• Never go first — wait for middleman\n' +
        '• No passwords or sensitive info\n' +
        '• Fake tickets = instant ban'
      )
      .setFooter({ text: 'Xrytha\'s Middleman Service • Verified & Trusted' })
      .setTimestamp();

    const btn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mm_open_modal')
        .setLabel('🎟️ Start Middleman Trade')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [btn] });
    await interaction.reply({ content: '✅ Panel sent!', ephemeral: true });
  }
};
