const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const BOT_OWNER_ID = process.env.DISCORD_OWNER_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mm-setup')
    .setDescription('🔒 Set up middleman panel'),

  async execute(interaction) {
    // Debug — what do we have?
    console.log('BOT_OWNER_ID from env:', BOT_OWNER_ID);
    console.log('Your user ID:', interaction.user.id);

    if (!BOT_OWNER_ID) {
      return interaction.reply({ content: '❌ DISCORD_OWNER_ID not found in Render!', ephemeral: true });
    }

    if (interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({ content: '❌ Not owner.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Xrytha\'s Middleman Service')
      .setColor('#9932CC')
      .setDescription('Click the button below to start a trade!\n\n🛡️ Never go first — always wait for a middleman.')
      .setFooter({ text: 'Xrytha\'s Middleman Service • Verified' });

    const btn = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mm_open_modal').setLabel('🎟️ Start Middleman Trade').setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [btn] });
    await interaction.reply({ content: '✅ Panel sent!', ephemeral: true });
  }
};
