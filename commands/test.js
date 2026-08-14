const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('🧪 Test if the bot & commands folder are working!')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional message to send back')
        .setRequired(false)
    ),

  async execute(interaction) {
    const msg = interaction.options.getString('message') || 'Everything works! 🎉';

    const embed = new EmbedBuilder()
      .setColor('#9333EA')
      .setTitle('✅ Bot Online & Connected!')
      .setDescription(msg)
      .addFields(
        { name: '🤖 Bot', value: `${interaction.client.user.tag}`, inline: true },
        { name: '👤 You', value: `${interaction.user.tag}`, inline: true },
        { name: '📂 Status', value: 'Commands folder loaded correctly ✅', inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
