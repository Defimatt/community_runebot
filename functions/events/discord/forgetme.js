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

const removeUser = async () => {
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
    stats[commandKey]--
    
    if (stats[commandKey] < 0) {
      stats[commandKey] = 0
    }
  }
  
  await kv.set({
    key: statsKey,
    value: stats,
  })
}

const updateStats = async () => {
  const statsKey = "stats"
  const commandKey = "forgetme"
  
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

content.push(`👋 Hey <@!${env.user.id}>, running */forgetme*!`)
content.push(``);

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
  content.push(`🤔 Runebot couldn't forget you as it doesn't know you yet!`);
  content.push(`➡️️ Try running */hello* to get started`);
  return await buildResponse()
}

if (!!results.nonce) {
  await lib.googlesheets.query['@0.3.0'].delete({
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

  content.push(`✅ Your in-progress verification has been cancelled`);
  content.push(`➡️️ You'll need to run */hello* and complete verification before using Runebot`);
  await updateStats()

  return await buildResponse()
}

await lib.googlesheets.query['@0.3.0'].delete({
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

content.push(`✅ Runebot has forgotten you`);
content.push(`➡️️ You'll need to run */hello* and complete verification before using Runebot again`);
await updateStats()
await removeUser()

return await buildResponse()
