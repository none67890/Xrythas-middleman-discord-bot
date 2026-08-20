const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');

// 🔒 YOUR OWNER ID — ONLY YOU CAN USE THIS COMMAND
const OWNER_ID = '1491469471775457290';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('🔒 Send the middleman ticket panel — Owner Only')
    .setDefaultMemberPermissions('0'), // 🔒 HIDDEN FROM EVERYONE ELSE

  async execute(interaction) {
    // 🔒 ONLY OWNER CAN RUN
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: '❌ **Access Denied.** Only the bot owner can use this.',
        ephemeral: true
      });
    }

    // 🎟️ PANEL EMBED — SIMPLE & CLEAN
    const panelEmbed = new EmbedBuilder()
      .setTitle('🛡️ Xrytha\'s Middleman — Trade Ticket')
      .setColor('#9932CC')
      .setDescription(`
Ready to trade? Follow the rules & stay safe! 💜🧡

📋 **Click 📜 RULES to read before opening**
🎟️ **Click 🎟️ OPEN TICKET to start your trade**
      `)
      .setFooter({ text: 'Xrytha\'s Middleman Service • Safe • Fair • Trusted' });

    // 🎯 BUTTONS — Rules + Open Ticket
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('show-ticket-rules')
        .setLabel('📜 RULES')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('open-mm-ticket')
        .setLabel('🎟️ OPEN TICKET')
        .setStyle(ButtonStyle.Primary)
    );

    // SEND PANEL
    await interaction.channel.send({
      embeds: [panelEmbed],
      components: [buttons]
    });

    await interaction.reply({
      content: '✅ Ticket panel sent!',
      ephemeral: true
    });
  }
};

// 📜 RULES EMBED — SENT WHEN THEY CLICK RULES BUTTON
module.exports.rulesEmbed = new EmbedBuilder()
  .setTitle('📜 TICKET RULES — Read Before Trading!')
  .setColor('#9932CC')
  .setDescription(`
## 📋 BEFORE YOU OPEN
✅ Both traders must agree — don't open without the other person
✅ Know exactly what you're trading — items, value, platform
✅ Be ready to send — don't open if you're away
✅ NO trust trades — if they refuse middleman = scam risk

## 🤝 HOW IT WORKS
**1. Open Ticket** → Fill out form → wait for middleman
**2. Middleman Claims** → Confirms both sides & trade details
**3. BOTH Send to Middleman FIRST** → Wait for both confirmations
**4. Middleman Releases** → Items sent to each side
**5. BOTH Confirm Received** → Ticket closed

## ⚠️ STRICT RULES
❌ Don't go first without middleman
❌ Don't change the deal last minute
❌ Don't trade in DMs — keep ALL in ticket
❌ Don't rush or pressure middleman
❌ Don't lie about items — be honest
❌ Don't close early — wait for both confirm

## 🚩 RED FLAGS — STOP & REPORT
🔴 "Just go first trust me"
🔴 "Let's do it in DMs faster"
🔴 Asks for money to middleman — OURS IS FREE!
🔴 Pressures you, rushes you, gets angry
🔴 Uses alt without telling you

## 💜 REMINDER
> **Never go first without a middleman. If something feels off — trust your gut.**
  `)
  .setFooter({ text: 'Xrytha\'s Middleman Service • Safe • Fair • Trusted' });
