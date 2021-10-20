const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});

await lib.discord.commands['@0.0.0'].create({
  "guild_id": "857533189948964874",
  "name": "guild",
  "description": "Get added to your guild",
  "options": []
});
