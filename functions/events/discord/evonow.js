// authenticates you with the API standard library
const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});
const fetch = require('node-fetch');
const moment = require('moment');
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
  let joined = content.join('\n')
  
  if (joined.length > 1900) {
    joined = joined.substring(0, 1900) + '\n...(too long for Discord to show)'
  }

  await lib.discord.channels[`@0.0.6`].messages.create({
    channel_id: env.channels.current,
    content: content.join(`\n`),
  })
}

const updateStats = async () => {
  const statsKey = "stats"
  const commandKey = "evonow"
  
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

content.push(`👋 Hey <@!${env.user.id}>, running */evonow*!`)
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

let username = results.username

if (!username) {
  content.push(`❌ Something went wrong getting your data`);
  content.push(`👨‍🔬 <@!${env.users.duffles}>, fix me please 🤖!`);
  return await buildResponse()
}

let servers = await ((await fetch(`https://cache.rune.game/evolution/servers.json?a=${new Date().valueOf()}`)).json());

let online = servers.filter(server => server.status == "online");

for (let server of online) {
  try {
    content.push(`🟢 ${server.name} ${server.regionId}`);
    content.push(` 🐉 ${server.playerCount}`)
    content.push(` 🎮 ${server.gameMode}`)
    content.push(` ⏰ ${server.timeLeftText}m`)
    content.push(` ➡️ ${server.roundId} rounds`)
    if (server.name == "Test Realm") {
      content.push(` ⚠️ Test server does not give rewards!`)
    } else {
      content.push(` ✨ ${server.rewardItemAmount} drop`)
      content.push(` ✨ ${server.rewardWinnerAmount} winner`)
    }
  } catch (e) {

  }
  content.push(``);
}

let offline = servers.filter(server => server.status == "offline");

for (let server of offline) {
  content.push(`🔴 ${server.name} ${server.regionId}`);
}

await updateStats()
return await buildResponse()
