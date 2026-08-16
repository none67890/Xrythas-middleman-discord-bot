const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to your data file
const dataPath = path.join(__dirname, '../vouches.json');
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');

const loadData = () => JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const saveData = (d) => fs.writeFileSync(dataPath, JSON.stringify(d, null, 2));

// ✅ PUT YOUR CHANNEL ID HERE — right-click channel → Copy Channel ID
const VOUCH_CHANNEL_ID = 'PUT_YOUR_CHANNEL_ID_HERE';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Vouch for a middleman')
    .addUserOption(option =>
      option.setName('middleman')
        .setDescription('Who you are vouching for')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('comment')
        .setDescription('Your experience / details of the trade')
        .setRequired(true)
    ),

  async execute(interaction) {
    const mm = interaction.options.getUser('middleman');
    const comment = interaction.options.getString('comment');
    const user = interaction.user;

    // Can't vouch for yourself
    if (mm.id === user.id) {
      return interaction.reply({ content: '❌ You cannot vouch for yourself!', ephemeral: true });
    }

    // Update vouch count
    const data = loadData();
    data[mm.id] = (data[mm.id] || 0) + 1;
    saveData(data);
    const count = data[mm.id];

    // Make the embed
    const embed = new EmbedBuilder()
      .setTitle('✅ NEW VOUCH — Middleman Service')
      .setColor('#9932CC')
      .addFields(
        { name: 'Middleman', value: `<@${mm.id}>`, inline: true },
        { name: 'Vouched By', value: `<@${user.id}>`, inline: true },
        { name: 'Total Vouches', value: `**${count}**`, inline: true },
        { name: 'Comment', value: comment }
      )
      .setTimestamp();

    // Find channel by ID — emojis don't matter!
    const channel = interaction.guild.channels.cache.get(VOUCH_CHANNEL_ID);

    if (!channel) {
      return interaction.reply({
        content: '❌ Could not find the vouch channel! Check the channel ID in code.',
        ephemeral: true
      });
    }

    // Send messages
    await channel.send({ embeds: [embed] });
    await interaction.reply({
      content: `✅ Vouch recorded! <@${mm.id}> now has **${count}** vouches.`,
      ephemeral: true
    });
  }
};
