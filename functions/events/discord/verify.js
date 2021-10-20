// authenticates you with the API standard library
const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN})
const fetch = require('node-fetch')
const ethers = require('ethers')
const kv = require('lib')({ token: process.env.STDLIB_SECRET_TOKEN}).utils.kv

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
  const commandKey = "verify"
  
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

const addUser = async () => {
  const statsKey = "stats"
  const commandKey = "users"
  
  let stats = await kv.get({
    key: statsKey,
  })
  
  if (!stats) {
    stats = {}
  }
  
  if (null == stats[commandKey]) {
    stats[commandKey] = 0
  } else {
    stats[commandKey]++
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

content.push(`👋 Hey <@!${env.user.id}>, welcome back to Runebot 🤖!`)
content.push(`➡️️ Let's get you verified!`)
content.push(``)

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

let userData = null

if (sheetQuery.rows && sheetQuery.rows[0] && sheetQuery.rows[0].fields && sheetQuery.rows[0].fields.Value) {
  try {
    userData = JSON.parse(sheetQuery.rows[0].fields.Value)
  } catch {}
}

if (userData == null) {
  content.push(`❌ Couldn't find a verification in progress`)
  content.push(`➡️️ Make sure you've run */hello* to begin verification`)
  return await buildResponse()
}

if (!userData.nonce) {
  content.push(`➡️️ You've already verified yourself with Runebot`)
  content.push(`➡️️ To remove the link with your Discord account, run */forgetme*`)
  return await buildResponse()
}

/* Is the verification code in a valid format? */
const verification = context.params.event.data.options[0].value.trim().split(`|`)

if (verification.length !== 2) {
  content.push(`❌ That verification code doesn't look right`)
  content.push(`➡️️ Make sure you copied & pasted the full verification code from Rune.game`)
  content.push(`➡️️ (Use the 'copy' button to make sure you get it all.)`)
  content.push(`➡️️ If that still isn't working, run */hello* again to get a new code`)
  return await buildResponse()
}

/* Does the nonce match? */
const nonce = userData.nonce

if (nonce !== verification[0]) {
  content.push(`❌ That verification code doesn't match`)
  content.push(`➡️️ This can happen if you're using an old verification code`)
  content.push(`➡️️ Run */hello* again to get a new code, then try to verify again`)
  return await buildResponse()
}

/* Get the address from the message */
let signer
try {
  signer = ethers.utils.verifyMessage(nonce, verification[1])
} catch (e) {
  content.push(`❌ Runebot couldn't decode that verification code`)
  content.push(`➡️️ Make sure you copied & pasted the full verification code from Rune.game`)
  content.push(`➡️️ (Use the 'copy' button to make sure you get it all.)`)
  content.push(`➡️️ If that still isn't working, run */hello* again to get a new code`)
  content.push(`👨‍🔬 <@!${env.users.duffles}>, debugging data 🤖! Error was: ${e}`)
  return await buildResponse()
}

content.push(`✅ Verification code accepted, looking up your Rune character...`)

/* Look up the Rune username */
let username
try {
  let result = await ((await fetch(`https://rune-api.binzy.workers.dev/users/${signer}`)).json())
  
  if (!!result.message && result.message === "No user exists" || !(result.username)) {
    content.push(`❌ Couldn't find a Rune user with that address`);
    content.push(`➡️️ Make sure the wallet you used to verify is the same wallet you use for your Rune character`)
    content.push(``)
    content.push(`🧙 If you don't have a character yet, you can create one at https://rune.game/profile/#u=duffles`)
    content.push(``)
    content.push(`➡️️ If you're sure you used the wallet *with your character*, run */hello* again to get a new code`)
    content.push(`➡️️ If that still doesn't work, ask in <#862149443934748692>`)
    return await buildResponse()
  } else {
    username = result.username
    content.push(``)
    content.push(`🧙 Found your Rune character`);
  }
}
catch (e) {
  content.push(`❌ Couldn't look up your Rune username, try later?`);
  content.push(`👨‍🔬 <@!${env.users.duffles}>, debugging data 🤖! Error was: ${e}`);
  return await buildResponse()
}

await lib.googlesheets.query['@0.3.0'].update({
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
  },
  fields: {
    'Value': JSON.stringify({address: signer, username: username})
  }
});

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
    let result = await contract.getUserProfile(signer);
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
     content.push(`✅ You can get chatting with your guildmates at <#${guildChannel}>!`);
     } catch (e) {
       content.push(`❌ Couldn't add you to the guild, sorry`);
       content.push(`👨‍🔬 <@!798237271081353276>, fix me please 🤖! Error was: ${JSON.stringify(e)}`);
     }
  }

content.push(``)
content.push(`✅ All done, you can run Runebot commands now!`)

await updateStats()
await addUser()
return await buildResponse()
