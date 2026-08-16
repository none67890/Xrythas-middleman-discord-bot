const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  ownerOnly: true, // 🔒 ONLY YOU CAN USE THIS
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Send a custom embed to a channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Embed title')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Main text / description')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Hex colour (default: purple/orange mix) e.g. FF7A00 or 9932CC')
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const color = interaction.options.getString('color') || '9932CC'; // purple default

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(`#${color}`)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Embed sent to ${channel}`, ephemeral: true });
  }
};
