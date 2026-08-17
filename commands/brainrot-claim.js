const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../brainrot-data.json');
const load = () => {try{return JSON.parse(fs.readFileSync(dataPath,'utf8'))}catch{return{}}};
const save = d => fs.writeFileSync(dataPath, JSON.stringify(d,null,2));

const ALERT_CHANNEL = '1537576113688150126';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brainrot-claim')
    .setDescription('Claim a spawned brainrot')
    .addStringOption(o => o.setName('spawn-id').setDescription('The Spawn ID').setRequired(true)),

  async execute(i) {
    const id = i.options.getString('spawn-id');
    const data = load();
    const spawn = data[id];

    if (!spawn) return i.reply({content:'❌ Spawn not found',ephemeral:true});
    if (spawn.claimedBy) return i.reply({content:`❌ Already claimed by <@${spawn.claimedBy}>`,ephemeral:true});

    spawn.claimedBy = i.user.id;
    spawn.claimedAt = new Date().toISOString();
    save(data);

    const colors = {Rare:'#3498DB',Epic:'#9B59B6',Legendary:'#F1C40F',Secret:'#E91E63'};

    const embed = new EmbedBuilder()
      .setTitle('✅ **BRAINROT CLAIMED!**')
      .setColor(colors[spawn.rarity])
      .addFields(
        {name:'🧠 Brainrot',value:`**${spawn.name}**`,inline:true},
        {name:'🎖️ Rarity',value:`**${spawn.rarity}**`,inline:true},
        {name:'✨ Traits',value:spawn.traits},
        {name:'🏆 Claimed By',value:`<@${i.user.id}>`,inline:true},
        {name:'📌 Status',value:'🟢 **SUCCESSFULLY CLAIMED!**'}
      )
      .setFooter({text:`Spawn ID: ${id}`})
      .setTimestamp();

    const ch = i.guild.channels.cache.get(ALERT_CHANNEL);
    if (ch) await ch.send({embeds:[embed]});
    await i.reply({content:`✅ Claimed **${spawn.name}**!`,ephemeral:true});
  }
};
