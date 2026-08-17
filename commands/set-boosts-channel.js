const { SlashCommandBuilder, ChannelType } = require('discord.js');

// Put YOUR Discord ID here
const BOT_OWNER_ID = 'YOUR_DISCORD_ID_HERE';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-boost-channel')
    .setDescription('🔒 Set where boost announcements go')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel for boost announcements')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    // Save to a simple JSON file
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../boost-config.json');
    
    fs.writeFileSync(dataPath, JSON.stringify({ channelId: channel.id }, null, 2));
    
    await interaction.reply({ content: `✅ Boost announcements will go to ${channel}`, ephemeral: true });
  }
};
