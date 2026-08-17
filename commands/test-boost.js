const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Put YOUR Discord ID here
const BOT_OWNER_ID = '1491469471775457290';
const BOOST_CHANNEL_ID = '1537576010436968628';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test-boost')
    .setDescription('🔒 Test boost announcement — OWNER ONLY'),

  async execute(interaction) {
    if (interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(BOOST_CHANNEL_ID);
    if (!channel) {
      return interaction.reply({ content: '❌ Boost channel not found!', ephemeral: true });
    }

    // Fake boost embed — same design as real one
    const boostEmbed = new EmbedBuilder()
      .setTitle('🚀 SERVER BOOSTED! — TEST MODE')
      .setColor('#F472B6')
      .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
      .setDescription(
        `This is a **test announcement**!\n\n` +
        `If you see this, your boost system works ✅\n` +
        `Real message will go here when someone actually boosts!`
      )
      .addFields(
        { name: '👤 Tested by', value: `<@${interaction.user.id}>`, inline: true },
        { name: '📅 Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Xrytha\'s Middleman Service • TEST — Not a real boost' })
      .setTimestamp();

    await channel.send({ content: `<@${interaction.user.id}> 🧪 TEST BOOST SENT!`, embeds: [boostEmbed] });
    await interaction.reply({ content: `✅ Test sent to <#${BOOST_CHANNEL_ID}>`, ephemeral: true });
  }
};
