const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../brainrot-data.json');
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');

const load = () => JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const save = d => fs.writeFileSync(dataPath, JSON.stringify(d, null, 2));

// ✅ PUT YOUR CHANNEL ID HERE
const ALERT_CHANNEL = '1537576113688150126';
// ✅ PUT YOUR STAFF ROLE ID HERE
const STAFF_ROLE = '1538830238593712190';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brainrot-spawn')
    .setDescription('🔒 Log a rare brainrot spawn')
    .addStringOption(o => o.setName('name').setDescription('Brainrot name').setRequired(true))
    .addStringOption(o => o.setName('rarity').setDescription('Rarity').addChoices(
      {name:'Rare',value:'Rare'},{name:'Epic',value:'Epic'},
      {name:'Legendary',value:'Legendary'},{name:'Secret',value:'Secret'}
    ).setRequired(true))
    .addStringOption(o => o.setName('traits').setDescription('Traits list').setRequired(true))
    .addStringOption(o => o.setName('image').setDescription('Image link').setRequired(false)),

  async execute(i) {
    if (!i.member.roles.cache.has(STAFF_ROLE)) return i.reply({content:'❌ Staff only',ephemeral:true});

    const name = i.options.getString('name');
    const rarity = i.options.getString('rarity');
    const traits = i.options.getString('traits');
    const img = i.options.getString('image');
    const id = Date.now().toString(36);

    const colors = {Rare:'#3498DB',Epic:'#9B59B6',Legendary:'#F1C40F',Secret:'#E91E63'};

    const data = load();
    data[id] = {name,rarity,traits,claimedBy:null,spawned:new Date().toISOString()};
    save(data);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ **RARE BRAINROT SPAWNED!**')
      .setColor(colors[rarity])
      .addFields(
        {name:'🧠 Name',value:`**${name}**`,inline:true},
        {name:'🎖️ Rarity',value:`**${rarity}**`,inline:true},
        {name:'✨ Traits',value:traits},
        {name:'📌 Status',value:'🔴 **UNCLAIMED — GO GET IT!**'}
      )
      .setFooter({text:`Spawn ID: ${id}`})
      .setTimestamp();
    if (img) embed.setImage(img);

    const ch = i.guild.channels.cache.get(ALERT_CHANNEL);
    if (!ch) return i.reply({content:'❌ Channel not found',ephemeral:true});

    await ch.send({content:'@everyone NEW RARE BRAINROT!',embeds:[embed]});
    await i.reply({content:`✅ Spawn logged! ID: \`${id}\``,ephemeral:true});
  }
};
