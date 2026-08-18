const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../vouches-data.json');
const VOUCH_CHANNEL_ID = '1537578277068079264'; // ← FILL THIS IN!

// Create file if it doesn't exist
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, '{}');

const loadData = () => JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const saveData = (data) => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Leave a vouch for someone')
    .addSubcommand(sub =>
      sub.setName('positive')
        .setDescription('✅ Positive vouch')
        .addUserOption(opt => opt.setName('user').setDescription('Who are you vouching for?').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason / trade details').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('negative')
        .setDescription('❌ Negative vouch')
        .addUserOption(opt => opt.setName('user').setDescription('Who are you vouching for?').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason / what went wrong').setRequired(true))
    ),

  async execute(interaction) {
    const type = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const author = interaction.user;

    // Can't vouch for yourself
    if (user.id === author.id) {
      return interaction.reply({ content: '❌ You can\'t vouch for yourself!', ephemeral: true });
    }

    // Only in vouch channel
    if (interaction.channel.id !== VOUCH_CHANNEL_ID) {
      return interaction.reply({ content: `❌ Use this in <#${VOUCH_CHANNEL_ID}> only!`, ephemeral: true });
    }

    const data = loadData();

    // Create user entry if first vouch
    if (!data[user.id]) {
      data[user.id] = { positives: 0, negatives: 0 };
    }

    // Add the vouch
    if (type === 'positive') data[user.id].positives++;
    else data[user.id].negatives++;

    saveData(data);

    const isPos = type === 'positive';
    const embed = new EmbedBuilder()
      .setTitle(isPos ? '✅ POSITIVE VOUCH' : '❌ NEGATIVE VOUCH')
      .setColor(isPos ? '#2ECC71' : '#E74C3C')
      .addFields(
        { name: 'User', value: `<@${user.id}>`, inline: true },
        { name: 'Vouched By', value: `<@${author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
        {
          name: '📊 Totals',
          value: `✅ Positives: **${data[user.id].positives}**\n❌ Negatives: **${data[user.id].negatives}**`,
          inline: false
        }
      )
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
