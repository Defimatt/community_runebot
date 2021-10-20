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
  const commandKey = "hello"
  
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

if (userData !== null) {
  if (!!userData.nonce) {
    content.push(`➡️️ You already had a verification in progress, this has now been cancelled`)
    content.push(`➡️️ Runebot will create a new link for you, please use that one as your previous link is no longer valid`)
  } else {
    content.push(`➡️️ You've already verified yourself with Runebot`)
    content.push(`➡️️ To remove the link with your Discord account, run */forgetme*`)
    return await buildResponse()
  }
} else {
  content.push(`➡️️ Before using any commands, you will need to link your Discord account with your BSC wallet`)
  content.push(`➡️️ This is done by signing a message on the Rune.game site (this doesn't use any gas)`)
  content.push(`➡️️ Rune.game will give you a code to copy & paste back here, which will verify your account`)
  content.push(`⚠️ After pasting the code, press TAB to make sure it's recognised as a command`)
}

const nonce = Math.floor(Math.random() * (9007199254740991 - 1000 + 1) + 1000)

if (userData !== null) {
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
      'Value': `{"nonce": "${nonce}"}`
    }
  });
} else {
  await lib.googlesheets.query['@0.3.0'].insert({
    range: `A1:B20000`,
    fieldsets: [
      {
        'Key': env.user.id,
        'Value': `{"nonce": "${nonce}"}`
      }
    ]
  });
}

content.push(``)
content.push(`https://rune.game/verify?message=${nonce}`)
content.push(``)

content.push(`🌐 Visit the link above, follow the instructions and paste the command back here to verify`)
content.push(`👋 See you soon!`)

await updateStats()
return await buildResponse()
