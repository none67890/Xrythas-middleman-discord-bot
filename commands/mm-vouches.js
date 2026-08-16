const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to your data file (same folder as main.js, NOT inside commands)
const dataPath = path.join(__dirname, '../vouches.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouches')
    .setDescription('Check how many vouches someone has')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');

    // Load data — empty if file doesn't exist yet
    let data = {};
    if (fs.existsSync(dataPath)) {
      try {
        data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      } catch {
        data = {};
      }
    }

    const count = data[target.id] || 0;

    const embed = new EmbedBuilder()
      .setTitle(`✅ Vouches for ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .setColor('#9932CC')
      .setDescription(`**${count}** vouches`);

    await interaction.reply({ embeds: [embed] });
  }
};
