// authenticates you with the API standard library
const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});
const fetch = require('node-fetch');
const ethers = require('ethers');
const moment = require('moment');
const _ = require('lodash');
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

  await lib.discord.channels[`@0.0.6`].messages.create({
    channel_id: env.channels.current,
    content: content.join(`\n`),
  })
}

const updateStats = async () => {
  const statsKey = "stats"
  const commandKey = "runebot"
  
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

content.push(`👋 Hey <@!${env.user.id}>, welcome to Runebot 🤖!`)
content.push(``);

let results = await kv.get({key: `${env.user.id}`});

if (results === null || !!results.nonce) {
  content.push(`➡️️ The first thing you'll want to do is introduce yourself to Runebot`);
  content.push(`➡️️ Try running */hello* to get started`);
  content.push(`➡️️ Once you've done that, you can run the commands below:`);
  content.push(``);
}

content.push(`➡️️ */evostats <server>* - (currently offline) find out how you're doing in Evolution on a specific server, or overall`)
content.push(`➡️️ */evonow* - find out who's playing Evolution and what game mode is currently being played`)
content.push(`➡️️ */refer* - track your referral stats`)
content.push(`➡️️ */forgetme* - log out of Runebot. You'll need to run */hello* after before you can use Runebot again`)

content.push(``)
content.push(`❓ For more help with Runebot, watch https://www.youtube.com/watch?v=NTZn_Jda2wo`)

await updateStats()
return await buildResponse()
