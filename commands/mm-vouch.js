const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../vouches.json');
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');

const loadData = () => JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const saveData = (d) => fs.writeFileSync(dataPath, JSON.stringify(d, null, 2));

// ✅ PUT YOUR CHANNEL ID HERE
const VOUCH_CHANNEL_ID = '1537578277068079264';

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
        .setDescription('Your experience / trade details')
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

    // ✅ KEEPS their current name — just adds (Vouch #X) at the end
    const member = interaction.guild.members.cache.get(mm.id);
    if (member && member.manageable) {
      // Remove old (Vouch #X) if there is one, then add the new one
      let baseName = member.displayName.replace(/\s*\(Vouch #\d+\)\s*$/, '');
      try {
        await member.setNickname(`${baseName} (Vouch #${count})`);
      } catch (e) {
        console.log('⚠️ Could not change nickname — check permissions/role order');
      }
    }

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

    const channel = interaction.guild.channels.cache.get(VOUCH_CHANNEL_ID);
    if (!channel) {
      return interaction.reply({ content: '❌ Vouch channel not found!', ephemeral: true });
    }

    await channel.send({ embeds: [embed] });
    await interaction.reply({
      content: `✅ Vouch recorded! <@${mm.id}> — **${count}** vouches.`,
      ephemeral: true
    });
  }
};
