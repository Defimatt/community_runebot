// authenticates you with the API standard library
const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});
const fetch = require('node-fetch');
const ethers = require('ethers');
const kv = require('lib')({ token: process.env.STDLIB_SECRET_TOKEN}).utils.kv;

const env = {
  channels: {
    bottesting: `862813194594156554`,
    runebot: `868640382437687297`,
    current: context.params.event.channel_id,
  },
  user: {
    id: context.params.event.member.user.id,
    username: context.params.event.member.user.username,
  },
  users: {
    duffles: `798237271081353276`,
  },
}

const disabled = false
const content = []

const buildResponse = async () => {
  content.push(``)
  content.push(`❓ For help with Runebot, run */runebot* or watch https://www.youtube.com/watch?v=NTZn_Jda2wo`)

  await lib.discord.channels[`@0.0.6`].messages.create({
    channel_id: env.channels.current,
    content: content.join(`\n`),
  })
}

const updateStats = async () => {
  const statsKey = "stats"
  const commandKey = "guild"
  
  let stats = await kv.get({
    key: statsKey,
  })
  
  if (!stats) {
    stats = {}
  }
  
  if (!stats[commandKey]) {
    stats[commandKey] = {}
  }
  
  if (env.user.id === env.users.duffles) {
    if (null == stats[commandKey].testing) {
      stats[commandKey].testing = 0
    } else {
      stats[commandKey].testing++
    }
  } else {
    if (null == stats[commandKey].live) {
      stats[commandKey].live = 0
    } else {
      stats[commandKey].live++
    }
  }
  
  await kv.set({
    key: statsKey,
    value: stats,
  })
}

/* Don't run the command at all if it's force disabled */
if (disabled && context.params.event.channel_id != env.channels.bottesting) {
  content.push(`Command under maintenance, try later!`)
  return await buildResponse()
}

/* Only run in the bottesting or runebot channels */
if (env.channels.current !== env.channels.bottesting && env.channels.current !== env.channels.runebot) {
  content.push(`⚠️ Runebot now lives in the <#${env.channels.runebot}> channel. Try your command there`)
  return await buildResponse()
}

content.push(`👋 Hey <@!${env.user.id}>, running */guild*!`)
content.push(``);

/* Do we already know the user? */
let sheetQuery = await lib.googlesheets.query['@0.3.0'].select({
  range: `A1:B20000`,
  bounds: 'FULL_RANGE',
  where: [
    {
      'Key__is': env.user.id
    }
  ],
  limit: {
    'count': 1,
    'offset': 0
  }
});

let results = null

if (sheetQuery.rows && sheetQuery.rows[0] && sheetQuery.rows[0].fields && sheetQuery.rows[0].fields.Value) {
  try {
    results = JSON.parse(sheetQuery.rows[0].fields.Value)
  } catch {}
}

if (results === null) {
  content.push(`🤔 Runebot doesn't know you yet!`);
  content.push(`➡️️ Try running */hello* to get started`);
  return await buildResponse()
}

if (!!results.nonce) {
  content.push(`🤔 You haven't finished verification yet!`);
  content.push(`➡️️ Try running */hello* to get started`);
  return await buildResponse()
}

let address = results.address

if (!address) {
  content.push(`❌ Something went wrong getting your data`);
  content.push(`👨‍🔬 <@!${env.users.duffles}>, fix me please 🤖!`);
  return await buildResponse()
}

if (!!address) {
  content.push(`➡️ Looking up your guild...`);
  
  const abi = [{
    "inputs": [
      {
        "internalType": "address",
        "name": "_userAddress",
        "type": "address"
      }
    ],
    "name": "getUserProfile",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }];

  const bscProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const contract = new ethers.Contract('0x2C51b570B11dA6c0852aADD059402E390a936B39', abi, bscProvider);

  let guild;

  try {
    let result = await contract.getUserProfile(address);
    guild = ethers.BigNumber.from(result[2]).toNumber();
  } catch (e) {
    content.push(`❌ Problems when looking up your guild`);
    content.push(`👨‍🔬 <@!798237271081353276>, fix me please 🤖! Error was: ${JSON.stringify(e)}`);
  }

  let guildName;
  let guildRole;
  let guildChannel;

  if (!!guild) {
    if (guild == 1) {
      guildName = "The First Ones";
      guildRole = "862170863827025950";
      guildChannel = "862153263804448769";
    } else if (guild == 2) {
      guildName = "The Archivists";
      guildRole = "862171000446779394";
      guildChannel = "862153353264627732";
    } else if (guild == 3) {
      guildName = "The Knights of Westmarch";
      guildRole = "862171051450040320";
      guildChannel = "862153403030700062";
    } else if (guild == 4) {
    guildName = "The Protectors";
    guildRole = "868956643050803241";
    guildChannel = "868973342626041956";
    } else if (guild == 5) {
    guildName = "The Destroyers";
    guildRole = "868957088079040553";
    guildChannel = "868974040478523472";
    } else {
      content.push(`❌ Your guild number is ${guild}, but I don't know what guild that is!`);
      content.push(`👨‍🔬 <@!798237271081353276>, fix me please 🤖! Unknown guild`);
    }
  }

  if (!!guildName) {
    content.push(`👪 Your guild is '${guildName}'`);
    content.push(`➡️ Adding you to your guild channel...`);
     try {
     await lib.discord.guilds['@0.0.6'].members.roles.update({
       role_id: `${guildRole}`,
       user_id: `${context.params.event.member.user.id}`,
       guild_id: `${context.params.event.guild_id}`
     });
     await lib.discord.guilds['@0.0.6'].members.roles.update({
       role_id: `862162202365919292`,
       user_id: `${context.params.event.member.user.id}`,
       guild_id: `${context.params.event.guild_id}`
     });
     content.push(`✅ All done, you can get chatting with your guildmates at <#${guildChannel}>!`);
     } catch (e) {
       content.push(`❌ Couldn't add you to the guild, sorry`);
       content.push(`👨‍🔬 <@!798237271081353276>, fix me please 🤖! Error was: ${JSON.stringify(e)}`);
     }
  }
}

await updateStats()
return await buildResponse()
