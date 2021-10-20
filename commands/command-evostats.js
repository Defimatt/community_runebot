const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});

await lib.discord.commands['@0.0.0'].create({
  "guild_id": "857533189948964874",
  "name": "evostats",
  "description": "Find out how you're doing in Rune Evolution",
  "options": [
    {
      "type": 3,
      "name": "server",
      "description": "The server you want stats for",
      "choices": [
        {
          "name": "overall",
          "value": "overall"
        },
        {
          "name": "europe 1",
          "value": "europe1"
        },
        {
          "name": "europe 2",
          "value": "europe2"
        },
        {
          "name": "europe 3",
          "value": "europe3"
        },
        {
          "name": "north america",
          "value": "na1"
        },
        {
          "name": "south america 1",
          "value": "sa1"
        },
        {
          "name": "south america 2",
          "value": "sa2"
        },
        {
          "name": "south america 3",
          "value": "sa3"
        },
        {
          "name": "south america 4",
          "value": "sa4"
        },
        {
          "name": "asia 1",
          "value": "asia1"
        },
        {
          "name": "asia 2",
          "value": "asia2"
        },
        {
          "name": "asia 3",
          "value": "asia3"
        },
        {
          "name": "asia 4",
          "value": "asia4"
        },
        {
          "name": "oceanic",
          "value": "oceanic1"
        }
      ],
      "required": true
    }
  ]
});
