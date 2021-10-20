const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});

await lib.discord.commands['@0.0.0'].create({
  "guild_id": "857533189948964874",
  "name": "hello",
  "description": "The start of your conversation with Runebot",
  "options": []
});
