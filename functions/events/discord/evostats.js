// authenticates you with the API standard library
const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});
const fetch = require('node-fetch');
const ethers = require('ethers');
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
  content.push(``)
  content.push(`❓ For help with Runebot, run */runebot* or watch https://www.youtube.com/watch?v=NTZn_Jda2wo`)

  await lib.discord.channels[`@0.0.6`].messages.create({
    channel_id: env.channels.current,
    content: content.join(`\n`),
  })
}

const updateStats = async () => {
  const statsKey = "stats"
  const commandKey = "evostats"
  
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

content.push(`👋 Hey <@!${env.user.id}>, running */evostats*!`)
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

let server = context.params.event.data.options[0].value;

const ordinalise = n => n+(n%10==1&&n%100!=11?'st':n%10==2&&n%100!=12?'nd':n%10==3&&n%100!=13?'rd':'th');
const commarise = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

let serverName;
if (server == "overall") {
  serverName = "Overall";
} else if (server == "europe1") {
  serverName = "Europe 1";
} else if (server == "europe2") {
  serverName = "Europe 2";
} else if (server == "europe3") {
  serverName = "Europe 3";
} else if (server == "na1") {
  serverName = "North America";
} else if (server == "sa1") {
  serverName = "South America 1";
} else if (server == "sa2") {
  serverName = "South America 2";
} else if (server == "sa3") {
  serverName = "South America 3";
} else if (server == "sa4") {
  serverName = "South America 4";
} else if (server == "asia1") {
  serverName = "Asia 1";
} else if (server == "asia2") {
  serverName = "Asia 2";
} else if (server == "asia3") {
  serverName = "Asia 3";
} else if (server == "asia4") {
  serverName = "Asia 4";
} else if (server == "oceanic1") {
  serverName = "Oceanic";
}else {
  serverName = "Unknown server 🤷"
}
content.push(`🌐 ${serverName}`);


let stats = await ((await fetch(`https://cache.rune.game/users/${address}/evolution.json`)).json());

content.push(`📅 Stats last updated: ${moment(stats.lastUpdated).fromNow()}`);

const servers = stats.servers;

if (!servers) {
  content.push(`❌ No stats available for you on *any* server, if you've played Evolution and stats aren't showing after 24 hours, please report in <#862149443934748692>`);
  await updateStats()
  return await buildResponse()
}

if (server === "overall") {
  stats = stats.overall;
} else {
  stats = servers[server];
}

if (!stats) {
  content.push(`❌ No stats available for you on that server, try another one (or overall)?`);
  await updateStats()
  return await buildResponse()

}
content.push(``);

const statToText = (accessor, preamble, round, postamble) => {
  let stat = stats[accessor];
  if (!stat) {
    content.push(`${preamble}: No data`);
    return;
  }
  if (round) stat = +stat.toFixed(2);

  let rankingData = stats.ranking[accessor];
  if (!rankingData) {
    content.push(`${preamble}: **${accessor == "earnings" ? "$" : ""}${commarise(stat)}**`);
  } else {
    let position = rankingData.position;
    let total = rankingData.total;
    if (!!position && !!total && position !== 0 && total !== 0) {
      content.push(`${preamble}: **${accessor == "earnings" ? "$" : ""}${commarise(stat)}** ${postamble} *(${ordinalise(position)} / ${total})*`); 
    }
  }
};

const statData = [
  {
    accessor: "rounds",
    preamble: "🎮 Rounds played",
  },
  {
    accessor: "timeSpent",
    preamble: "🕓 Time played",
    postamble: "hours",
    round: true,
    gap: true,
  },

  {
    accessor: "wins",
    preamble: "🏆 Wins",
  },
  {
    accessor: "winStreak",
    preamble: "🏆🏆 Longest win streak",
  },
  {
    accessor: "winRatio",
    preamble: "🏆/🎮 Win ratio",
    round: true,
    gap: true,
  },

  {
    accessor: "points",
    preamble: "🔟 Points scored",
  },
  {
    accessor: "roundPointRatio",
    preamble: "🔟/🎮 Points per round",
    round: true,
    gap: true,
  },

  {
    accessor: "kills",
    preamble: "💀 Kills",
  },{
    accessor: "deaths",
    preamble: "☠️ Deaths",
  },{
    accessor: "killDeathRatio",
    preamble: "💀/☠️ Kill:Death ratio",
    round: true,
    gap: true,
  },

  {
    accessor: "rewards",
    preamble: "💎 Rewards",
  },
  {
    accessor: "earnings",
    preamble: "💲 Earnings",
    round: true,
    gap: true,
  },

  {
    accessor: "powerups",
    preamble: "✨ Powerups",
  },
  {
    accessor: "evolves",
    preamble: "🐲 Evolves",
  },
  {
    accessor: "orbs",
    preamble: "🔮 Orbs",
  },
  {
    accessor: "revenges",
    preamble: "😡 Revenges",
    gap: true,
  },

  {
    accessor: "averageLatency",
    preamble: "⚡ Average latency",
    round: true,
    postamble: "milliseconds",
  },
];

for (let stat of statData) {
  statToText(stat.accessor, stat.preamble, (!!stat.round ? stat.round : false), (!!stat.postamble ? stat.postamble : ""));
  if (stat.gap) content.push(``);
}

await updateStats()
return await buildResponse()
