const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; // Render assigns PORT automatically

app.get('/', (req, res) => {
  res.send('✅ Bot is alive!');
});

app.listen(PORT, () => {
  console.log(`🌐 Keepalive running on port ${PORT}`);
});
