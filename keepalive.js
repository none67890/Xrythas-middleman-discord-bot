// keepalive.js — ✅ Fixed for Render
const express = require('express');
const app = express();

// ✅ Use Render's actual port — NOT hardcoded 10000
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`✅ Xrytha's Middleman Bot is alive!`);
});

app.listen(PORT, () => {
  console.log(`🌐 Keepalive running on port ${PORT}`);
});
