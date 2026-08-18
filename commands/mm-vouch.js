const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../vouches-data.json');
const ALLOWED_CHANNEL = '1537578277068079264'; // Your vouch channel

// Create file if it doesn't exist
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, '{}');

const loadData = () => JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const saveData = (data) => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

// Update nickname with (vouch X)
async function updateNickname(member, count) {
  const displayName = member.nickname || member.user.username;
  // Remove old (vouch X) if already there
  const cleanName = displayName.replace(/\s*\(vouch\s*\d*\)\s*$/i, '');
  const newNick = `${cleanName} (vouch ${count})`;
  
  try {
    await member.setNickname(newNick, 'Vouch count updated');
  } catch (err) {
    console.log('⚠️ Could not change nickname — check bot permissions');
  }
}

module.exports = {
  async execute(message, args) {
    // ❌ Wrong channel
    if (message.channel.id !== ALLOWED_CHANNEL) {
      return message.reply(`❌ Use this in <#${ALLOWED_CHANNEL}> only!`);
    }

    // ❌ No user mentioned
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply(
        '❌ **Wrong format!**\n' +
        '✅ **Do this:** `vouchers @User reason`\n' +
        '📝 Example: `vouchers @Xrytha great trade, went first!`'
      );
    }

    // ❌ Vouching for yourself
    if (targetUser.id === message.author.id) {
      return message.reply('❌ You can\'t vouch for yourself!');
    }

    // ❌ No reason given
    const reason = args.slice(1).join(' ');
    if (!reason) {
      return message.reply(
        '❌ **You forgot the reason!**\n' +
        '✅ **Do this:** `vouchers @User reason`\n' +
        '📝 Example: `vouchers @Xrytha trusted middleman, fast service`'
      );
    }

    // ✅ Everything good — save the vouch
    const data = loadData();
    if (!data[targetUser.id]) data[targetUser.id] = { count: 0 };
    data[targetUser.id].count++;
    saveData(data);

    const newCount = data[targetUser.id].count;

    // Update nickname
    const targetMember = message.guild.members.cache.get(targetUser.id);
    if (targetMember) {
      await updateNickname(targetMember, newCount);
    }

    // Success embed
    const embed = new EmbedBuilder()
      .setTitle('✅ VOUCH ADDED')
      .setColor('#9932CC')
      .addFields(
        { name: 'User', value: `<@${targetUser.id}>`, inline: true },
        { name: 'Vouched By', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: '📊 Total Vouches', value: `**${newCount}**`, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
