const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});

await lib.discord.commands['@0.0.0'].create({
  "guild_id": "857533189948964874",
  "name": "verify",
  "description": "Link your Discord account with your BSC wallet",
  "options": [
    {
      "type": 3,
      "name": "code",
      "description": "The verification code from Rune.farm",
      "required": true
    }
  ]
});
