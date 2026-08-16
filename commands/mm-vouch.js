const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../vouches.json');
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');

const loadData = () => JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const saveData = (d) => fs.writeFileSync(dataPath, JSON.stringify(d, null, 2));

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

    if (mm.id === user.id) {
      return interaction.reply({ content: '❌ You cannot vouch for yourself!', ephemeral: true });
    }

    const data = loadData();
    data[mm.id] = (data[mm.id] || 0) + 1;
    saveData(data);
    const count = data[mm.id];

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

    // ✅ YOUR channel name: middleman-vouches
    const channel = interaction.guild.channels.cache.find(
      c => c.name.toLowerCase() === 'middleman-vouches'
    );

    if (!channel) {
      return interaction.reply({
        content: '❌ Could not find `#middleman-vouches` channel!',
        ephemeral: true
      });
    }

    await channel.send({ embeds: [embed] });
    await interaction.reply({
      content: `✅ Vouch recorded! <@${mm.id}> now has **${count}** vouches.`,
      ephemeral: true
    });
  }
};
