# Runebot Discord bot

## Platform

Uses AutoCode as a platform.

See https://autocode.com/guides/how-to-build-a-discord-bot/ for a guide.

If you want to test, you'll need to create your own test bot at https://discord.com/developers/applications, then add it to your own server. You'll have to swap out role ids and channel ids then swap them back - feel free to automate this!

## Contributing

Please branch and send PR.

`package.json` is managed through a tool on the platform, if you want to add any packages, write details of the package and version in the PR notes.

Currently installed are:

```
"lib": "latest",
"node-fetch": "^2.6.1",
"ethers": "^5.4.1",
"moment": "^2.29.1",
"lodash": "^4.17.21"
```

If you want to add any new commands, put the implementation of the command in the `functions/events/discord` folder. You'll also need to generate a specification of command inputs, to do this use https://autocode.com/tools/discord/command-builder/. Put the generated code (example below) in a file in subfolder `commands` called `command-{COMMAND_NAME}.js`.

Example command builder output for `/evostats`:

```js
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
```

## Useful Resources

- [Official Guide to Building Discord Bots on Autocode](https://autocode.com/guides/how-to-build-a-discord-bot/)
- [The Discord Slash Command Builder](https://autocode.com/discord-command-builder/)
- [Formatting Discord messages](https://discord.com/developers/docs/reference#message-formatting)
- [Discord slash command docs](https://discord.com/developers/docs/interactions/slash-commands)
- [Discord developer portal](https://discord.com/developers/applications)
- [Autocode discord/commands API page for creating slash commands](https://autocode.com/lib/discord/commands/)
- [How to find your Discord guild id](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-)
