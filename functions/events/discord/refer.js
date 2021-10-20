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
  content.push(``)
  content.push(`❓ For help with Runebot, run */runebot* or watch https://www.youtube.com/watch?v=NTZn_Jda2wo`)

  await lib.discord.channels[`@0.0.6`].messages.create({
    channel_id: env.channels.current,
    content: content.join(`\n`),
  })
}

const updateStats = async () => {
  const statsKey = "stats"
  const commandKey = "refer"
  
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

content.push(`👋 Hey <@!${env.user.id}>, running */refer*!`)
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

const stats = await ((await fetch("https://coordinator.rune.game/data/refers.json")).json());

const referrals = stats.map(stat => stat.referrer).filter(stat => stat != "Botter");
const count = _.countBy(referrals);
const pairs = _.toPairs(count);
const sorted = pairs.sort((a,b) => b[1] - a[1]);

content.push(`🏆 Top 5 referrers:`);

for (let i = 0; i < 5; ++i) {
  content.push(`• ${sorted[i][0]} - ${sorted[i][1]}`);
}

content.push(``);

let referrers = new Set(referrals).size;
let referralCount = referrals.length;

content.push(`${referrers} referrers, ${referralCount} referrals, average ${+((referralCount / referrers).toFixed(1))} referrals each`)

content.push(``);

content.push(`🤝 Your referrals:`);
let user = pairs.find(pair => pair[0] == username);
let position = sorted.findIndex(pair => pair[0] == username);

if (!user) {
  content.push(`Looks like you haven't referred anyone yet, share your referral link`);
  content.push(`https://rune.game/#u=${username}`);
} else if (position === 0) {
  content.push(`You're the top referrer, congratulations!'`);
  content.push(`Not that you need reminding, but your referral link is https://rune.game/#u=${username}`);
} else {
  let userReferrals = user[1];
  content.push(`You're in position ${position + 1} with ${userReferrals} referrals. You need ${sorted[0][1] - userReferrals + 1} more referrals to hit the top spot`);
  content.push(`Keep sharing your referral link - https://rune.game/#u=${username}`);
}

await updateStats()
return await buildResponse()
