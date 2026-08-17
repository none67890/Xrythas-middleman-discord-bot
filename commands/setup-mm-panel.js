const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

// ✅ Pulls from Render secrets — NO typos!
const BOT_OWNER_ID = process.env.DISCORD_OWNER_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mm-setup')
    .setDescription('🔒 [OWNER] Create middleman ticket panel'),

  async execute(interaction) {
    // Check if env var is set
    if (!BOT_OWNER_ID) {
      return interaction.reply({
        content: '❌ Error: DISCORD_OWNER_ID not set in Render environment variables!',
        ephemeral: true
      });
    }

    // Check if user is owner
    if (interaction.user.id !== BOT_OWNER_ID) {
      return interaction.reply({
        content: '❌ Only the bot owner can use this command!',
        ephemeral: true
      });
    }

    // Professional embed for Xrytha's Middleman Service
    const panelEmbed = new EmbedBuilder()
      .setTitle('🎟️ **Xrytha\'s Middleman Service**')
      .setColor('#9932CC')
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .setDescription(
        'Welcome to **Xrytha\'s Middleman Service** — your trusted, safe way to trade!\n\n' +
        '📌 **How It Works:**\n' +
        '1. Click **"Start Middleman Trade"** below\n' +
        '2. Fill out the quick form — what you\'re trading & who with\n' +
        '3. A private ticket channel will open automatically\n' +
        '4. Wait for a verified middleman to assist you\n' +
        '5. Complete your trade safely — no scams!\n\n' +
        '🛡️ **SAFETY RULES:**\n' +
        '• We NEVER ask for your password — anyone asking is a scammer\n' +
        '• We NEVER DM you first — check our verified roles!\n' +
        '• NEVER go first — always follow middleman instructions\n' +
        '• Fake tickets or abuse = instant ban\n\n' +
        '💜 **Trusted • Verified • Safe**'
      )
      .addFields(
        { name: '📋 Need Help?', value: 'Ping any verified middleman in the server' },
        { name: '⚠️ Important', value: 'Please be patient — middlemen are busy too!' }
      )
      .setFooter({ text: 'Xrytha\'s Middleman Service • Verified & Trusted' })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mm_open_modal')
        .setLabel('🎟️ Start Middleman Trade')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎟️')
    );

    await interaction.channel.send({ embeds: [panelEmbed], components: [buttons] });
    await interaction.reply({ content: '✅ Ticket panel sent!', ephemeral: true });
  }
};
