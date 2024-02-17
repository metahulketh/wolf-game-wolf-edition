import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits, ActivityType } from "discord.js";
import Web3 from 'web3';
import Web3Token from 'web3-token';



async function updateActivityStatus() {
  const { woolPrice, ethPrice } = await fetchCoinGeckoPrice();
  const statusText = `1M $wool = ${formatNumber(woolPrice * 1000000 / ethPrice)} ETH`
  client.user.setActivity(statusText, {
    type: ActivityType.Watching,
  });
}

async function updatePriceChannel() {
  try {
    const formattedData = await getFormattedData();
    const data = formattedData.join("\n");
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
      console.error("Channel not found");
      return;
    }
    const fetched = await channel.messages.fetch({ limit: 100 });
    await channel.bulkDelete(fetched);

    const middle = Math.ceil(data.length / 2);
    const firstHalf = data.slice(0, middle);
    const secondHalf = data.slice(middle);

    // sending  in two messages  since the body size is large
    channel.send(firstHalf);
    channel.send(secondHalf);
    
  } catch (e) {
    console.error("updatePriceChannel failed", e);
  }
}

async function getPrices() {
  const { woolPrice, ethPrice } = await fetchCoinGeckoPrice();
  const gasPrice = await fetchGasPrices();
  const peakCredit = await fetchPeakCreditPrice();
  const chops = await fetchChopsPrice();
  const wgSwapRates = await fetchWGSwapRates();
  const collectingStatus = await fetchWGCollectingStatus();
  const collectionDetails = getCollectionDetails(collectingStatus);

  const inGameRatesInWool = wgSwapRates
    .filter((rate) => rate.assetB === "meat")
    .reduce((acc, rate) => {
      acc[rate.assetA] = (rate.assetBAmount / rate.assetAAmount) * chops;
      return acc;
    }, {});

  const sheepGen0Chopped = 1300 * chops;
  const sheepGen1Chopped = 960 * chops;
  const sheepGen2Chopped = 750 * chops;

  return {
    woolPrice,
    ethPrice,
    gasPrice,
    peakCredit,
    chops,
    sheepGen0Chopped,
    sheepGen1Chopped,
    sheepGen2Chopped,
    collectionDetails,
    ...inGameRatesInWool,
  };
}

async function getFormattedData() {
  const {
    woolPrice,
    gasPrice,
    peakCredit,
    chops,
    ethPrice,
    water,
    stone,
    grass,
    wood,
    sheepGen0Chopped,
    sheepGen1Chopped,
    sheepGen2Chopped,
    collectionDetails,
  } = await getPrices();

  const  {
    totalWolvesWithEnergy,
    totalWolvesWithMaxEnergy,
    totalWolvesWithNoEnergy,
    totalWolvesRecharging,
    totalWolvesBreeding,
    totalWolvesOnCooldown,
    totalWolvesInGame,
    totalWolvesNotInGame,
    totalSheepWithEnergy,
    totalSheepWithMaxEnergy,
    totalSheepWithNoEnergy,
    totalSheepRecharging,
    totalSheepBreeding,
    totalSheepCollecting,
    totalSheepInGame,
    totalSheepNotInGame
  } = await fetchWGBulkChars();
  

  const crypto = [
    ["## ** Crypto Prices**"],
    [`${woolEmoji} = $${woolPrice}`],
    [`1M ${woolEmoji} = ${formatNumber(woolPrice * 1000000 / ethPrice)} ETH`],
    [`ETH = $${ethPrice}`],
    [`⛽ ${gasPrice.ProposeGasPrice} gwei`]
  ];

  const tokens = [
    ["## **In Game Token Prices**"],
    ["🥩", chops],
    ["🪨", stone],
    ["💦", water],
    ["🎟️", peakCredit],
    ["🍃", grass],
    ["🪵", wood],
    ["1K 🥩", chops * 1000, true],
    ["1K 🪨", stone * 1000, true],
    ["1K 💦", water * 1000, true],
    ["1K 🎟️", peakCredit * 1000, true],
    ["1K 🍃", grass * 1000, true],
    ["1K 🪵", wood * 1000, true],
    ["## **⚡ to 🎟️**"],
    ["G0 A8 🐺 max ⚡ to 🎟️", 8 * 2000 * peakCredit, true],
    ["G1 A8 🐺 max ⚡ to 🎟️", 8 * 1600 * peakCredit, true],
    ["G0 A7 🐺 max ⚡ to 🎟️", 7 * 2000 * peakCredit, true],
    ["G1 A7 🐺 max ⚡ to 🎟️", 7 * 1600 * peakCredit, true],
    ["G0 A6 🐺 max ⚡ to 🎟️", 6 * 2000 * peakCredit, true],
    ["G1 A6 🐺 max ⚡ to 🎟️", 6 * 1600 * peakCredit, true],
    ["G0 A5 🐺 max ⚡ to 🎟️", 5 * 2000 * peakCredit, true],
    ["G1 A5 🐺 max ⚡ to 🎟️", 5 * 1600 * peakCredit, true],
    ["G0 🐑 max ⚡ to 🎟️", 1000 * peakCredit, true],
    ["G1 🐑 max ⚡ to 🎟️", 800 * peakCredit, true],
    ["G2 🐑 max ⚡ to 🎟️", 750 * peakCredit, true],
    ["## ** Sacrificing🪓 🐑**"],
    ["🪓🐑 🥩 G0 max ⚡", sheepGen0Chopped, true, true],
    ["🪓🐑 🥩 G1 max ⚡", sheepGen1Chopped, true, true],
    ["🪓🐑 🥩 G2 max ⚡", sheepGen2Chopped, true, true],
    ["## **Recharging⚡ cost**"],
    ["🐑 full ⚡ cost", 8000, true, true],
  ].map((data) =>
    data.length > 1
      ? `${data[0]} = ${formatPrice({
          token: data[1],
          woolPrice,
          ethPrice,
          displayDollarValue: Boolean(data[2]),
          displayETHValue: Boolean(data[3]),
        })}`
      : data[0],
  );
  const totalActiveSheep = totalSheepRecharging + totalSheepBreeding + totalSheepCollecting;
  const totalActiveWolves = totalWolvesRecharging + totalWolvesBreeding + totalWolvesOnCooldown;
  const totalActiveAnimals =  totalActiveSheep + totalActiveWolves;
  const totalSheep = totalSheepInGame + totalSheepNotInGame;
  const totalWolves = totalWolvesInGame + totalWolvesNotInGame;
  const totalAnimals = totalSheep + totalWolves;
  const idlSheep = totalSheepWithEnergy - totalSheepRecharging - totalSheepBreeding - totalSheepCollecting;
  const totalIdlWolves = totalWolvesWithEnergy - totalWolvesRecharging - totalWolvesBreeding - totalWolvesOnCooldown;
  
  const moreData = [
    ["## **Current State of Farm & Peak**"],
    // ["total 🐑 gathering resources", collectionDetails.totalSheep],
    ["Actively Playing 🐑 + 🐺", totalActiveAnimals, calculatePercentage(totalActiveAnimals, totalAnimals)],
    ["Actively Playing 🐑", totalActiveSheep, calculatePercentage(totalActiveSheep, totalSheep)],
    ["Actively Playing 🐺", totalActiveWolves, calculatePercentage(totalActiveWolves, totalWolves)],
    ["##  **🐑 Status**"],
    ["🐑 in 🎮", totalSheepInGame, calculatePercentage(totalSheepInGame, totalSheep)],
    ["🐑 not in 🎮", totalSheepNotInGame, calculatePercentage(totalSheepNotInGame, totalSheep)],
    ["🐑 idle", idlSheep, calculatePercentage(idlSheep, totalSheep)],
    ["🐑 recharging🔋", totalSheepRecharging, calculatePercentage(totalSheepRecharging, totalSheep)],
    ["🐑 breeding ❤️", totalSheepBreeding, calculatePercentage(totalSheepBreeding, totalSheep)],
    ["🐑 collecting 🍃💦🪨🪵", totalSheepCollecting, calculatePercentage(totalSheepCollecting, totalSheep)],
    ["🐑 collecting 🍃", collectionDetails.totalGrassCollectors],
    ["🐑 collecting 💦", collectionDetails.totalWaterCollectors],
    ["🐑 collecting 🪨", collectionDetails.totalStoneCollectors],
    ["🐑 collecting 🪵", collectionDetails.totalWoodCollectors],
    ["## **🐑 ⚡ Status**"],
    ["🐑 with ⚡", totalSheepWithEnergy, calculatePercentage(totalSheepWithEnergy, totalSheep)],
    ["🐑 with max ⚡", totalSheepWithMaxEnergy, calculatePercentage(totalSheepWithMaxEnergy, totalSheep)],
    ["🐑 no ⚡", totalSheepWithNoEnergy, calculatePercentage(totalSheepWithNoEnergy, totalSheep)],
    ["\n🎮 Wolf Gambit", collectionDetails.wolfGambitPercent],
    ["🎮 Prisoners Delimma", collectionDetails.prisonerDelimmaPercent],
    ["## **🐺 Status**"],
    ["🐺 in 🎮", totalWolvesInGame, calculatePercentage(totalWolvesInGame, totalWolves)],
    ["🐺 not in 🎮", totalWolvesNotInGame, calculatePercentage(totalWolvesNotInGame, totalWolves)],
    ["🐺 idle", totalIdlWolves, calculatePercentage(totalIdlWolves, totalWolves)],
    ["🐺 recharging🔋", totalWolvesRecharging, calculatePercentage(totalWolvesRecharging, totalWolves)],
    ["🐺 breeding ❤️", totalWolvesBreeding, calculatePercentage(totalWolvesBreeding, totalWolves)],
    ["🐺 on cooldown 😓", totalWolvesOnCooldown, calculatePercentage(totalWolvesOnCooldown, totalWolves)],
    ["## **🐺 ⚡ Status**"],
    ["🐺 with ⚡", totalWolvesWithEnergy, calculatePercentage(totalWolvesWithEnergy, totalWolves)],
    ["🐺 with max ⚡", totalWolvesWithMaxEnergy, calculatePercentage(totalWolvesWithMaxEnergy, totalWolves)],
    ["🐺 no ⚡", totalWolvesWithNoEnergy, calculatePercentage(totalWolvesWithNoEnergy, totalWolves)],
  ].map((data) => { 
    if (data.length === 1)  {
      return data[0]
    }

    const [label, value, percentValue] = data;
    const formattedValue = formatNumber(value);
    if (percentValue) {
      return `${label} = ${formattedValue}       ${percentValue}`;
    } 
    return `${label} = ${formattedValue}`;
  })

  return ["# **Wolf Game: 🐺 Edition Hourly Report**",...crypto, ...moreData,  ...tokens];
}

async function fetchGasPrices() {
  const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status && data.status === "1") {
      return data.result;
    } else {
      throw new Error("Failed to fetch gas prices");
    }
  } catch (error) {
    console.error("Error fetching gas prices:", error);
    return null;
  }
}

async function fetchCoinGeckoPrice() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=wolf-game-wool,ethereum&vs_currencies=usd";

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      woolPrice: data["wolf-game-wool"].usd.toFixed(4),
      ethPrice: data.ethereum.usd,
    };
  } catch (e) {
    return {
      woolPrice: 0,
      ethPrice: 0,
    };
  }
}

async function fetchPeakCreditPrice() {
  try {
    const data = await fetchFeralFlipsSwapRates("CREDITS");
    return data.result.outputAmount;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

async function fetchChopsPrice() {
  const data = await fetchFeralFlipsSwapRates();
  return data.result.outputAmount;
}

async function fetchFeralFlipsSwapRates(from = "CHOPS", to = "WOOL") {
  const message = 'Hello, authenticate me!';
  const token = await signMessage(message);
  try {
    const response = await fetch(
      "https://tlvq3tu3yc.execute-api.us-west-2.amazonaws.com/prod/quote",
      {
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          address: SIGNER_ADDRESS,
          token,
          amount: "1",
          inputToken: from,
          outputToken: to
        }),
        method: "POST",
      },
    );
    const data = await response.json();
    return data;
  } catch(e) {
    console.log('FeralFlip failed', e, signature);
  }
}

async function fetchWGSwapRates() {
  const response = await fetch(
    "https://hdfat7b8eg.execute-api.us-west-2.amazonaws.com/prod/external/v1/swap-rates",
    {
      headers: {
        "content-type": "application/json",
        "x-wg-api-key": WOLF_GAME_API_KEY,
      },
      method: "GET",
    },
  );
  const data = await response.json();
  return data;
}

async function fetchWGCollectingStatus() {
  const response = await fetch(
    "https://hdfat7b8eg.execute-api.us-west-2.amazonaws.com/prod/external/v1/bulk-collecting-status",
    {
      headers: {
        "content-type": "application/json",
        "x-wg-api-key": WOLF_GAME_API_KEY,
      },
      method: "GET",
    },
  );
  const data = await response.json();
  return data;
}

async function fetchWGBulkChars() {
  const baseUrl =
    "https://hdfat7b8eg.execute-api.us-west-2.amazonaws.com/prod/external/v1/bulk-characters?page=";
  const urls = [
    baseUrl + 1,
    baseUrl + 2,
    baseUrl + 3,
    baseUrl + 4,
    baseUrl + 5,
    baseUrl + 6,
  ];
  const getData = async (url) => {
    const response = await fetch(url, {
      headers: {
        "content-type": "application/json",
        "x-wg-api-key": WOLF_GAME_API_KEY,
      },
      method: "GET",
    });
    const data = await response.json();
    return data;
  };
  const results = await Promise.all(urls.map((url) => getData(url)));
  const flattenResults = results.flatMap((result) => result)
  
  const totalWolvesWithEnergy = flattenResults.filter(char => char.type === 'WOLF' && char.energy >= 25).length;
  const totalWolvesWithMaxEnergy = flattenResults.filter(char => char.type === 'WOLF' && char.energy === char.maxEnergy).length;
  const totalWolvesWithNoEnergy = flattenResults.filter(char => char.type === 'WOLF' && char.energy < 25).length;
  const totalWolvesRecharging = flattenResults.filter(char => char.type === 'WOLF' && char.action === 'RECHARGING').length;
  const totalWolvesBreeding = flattenResults.filter(char => char.type === 'WOLF' && char.action === 'BREEDING').length;
  const totalWolvesOnCooldown =flattenResults.filter(char => char.type === 'WOLF' && char.cooldownUntil !== null).length;
  const totalWolvesInGame = flattenResults.filter(char => char.type === 'WOLF' && char.communityId !== null).length;
  const totalWolvesNotInGame = flattenResults.filter(char => char.type === 'WOLF' && char.communityId === null).length;

  const totalSheepWithEnergy = flattenResults.filter(char => char.type === 'SHEEP' && char.energy >= 10).length;
  const totalSheepWithMaxEnergy = flattenResults.filter(char => char.type === 'SHEEP' && char.energy === char.maxEnergy).length;
  const totalSheepWithNoEnergy = flattenResults.filter(char => char.type === 'SHEEP' && char.energy < 10).length;
  const totalSheepRecharging = flattenResults.filter(char => char.type === 'SHEEP' && char.action === 'RECHARGING').length;
  const totalSheepBreeding = flattenResults.filter(char => char.type === 'SHEEP' && char.action === 'BREEDING').length;
  const totalSheepCollecting = flattenResults.filter(char => char.type === 'SHEEP' && char.action === 'COLLECTING').length;
  const totalSheepInGame = flattenResults.filter(char => char.type === 'SHEEP' && char.communityId !== null).length;
  const totalSheepNotInGame = flattenResults.filter(char => char.type === 'SHEEP' && char.communityId === null).length;
  
  const actions = flattenResults.filter(char => char.type === 'SHEEP' && char.action !== null).reduce((acc, rec) => {
    acc[rec.action] =true 
    return acc
  }, {});

  return {
    totalWolvesWithEnergy,
    totalWolvesWithMaxEnergy,
    totalWolvesWithNoEnergy,
    totalWolvesRecharging,
    totalWolvesBreeding,
    totalWolvesOnCooldown,
    totalWolvesInGame,
    totalWolvesNotInGame,
    totalSheepWithEnergy,
    totalSheepWithMaxEnergy,
    totalSheepWithNoEnergy,
    totalSheepRecharging,
    totalSheepBreeding,
    totalSheepCollecting,
    totalSheepInGame,
    totalSheepNotInGame
  };
}

function formatNumber(num, decimalPlaces = 2) {
  if (!isNumeric(num)) {
    return num;
  }
  const numStr = Number(num).toFixed(decimalPlaces);

  return new Intl.NumberFormat().format(numStr);
}

function isNumeric(str) {
  return /^\d+(\.\d+)?$/.test(str);
}

function calculatePercentage(value, total) {
  if (total === 0) {
      return `0%`; // Avoid division by zero
  }
  return `${formatNumber((value / total) * 100)}%`;
}

function formatPrice({
  token,
  ethPrice,
  woolPrice,
  displayDollarValue = false,
  displayETHValue = false,
}) {
  let str = `${formatNumber(token)} ${woolEmoji}`;
  if (displayDollarValue) {
    str += `      $${formatNumber(token * woolPrice, 6)}`;
  }

  if (displayETHValue) {
    str += `      ${formatNumber((token * woolPrice) / ethPrice, 6)} ETH`;
  }
  return str;
}

function getCollectionDetails(collectingStatus) {
  const totalSheep = collectingStatus.filter(
    (character) => character.looting.looted === false,
  ).length;

  const wolfGambitPercent = (
    collectingStatus.filter(
      (character) => character.gameType === "WOLFS_GAMBIT",
    ).length / totalSheep
  ).toFixed(2);

  const prisonerDelimmaPercent = 1 - wolfGambitPercent;
  const totalGrassCollectors = collectingStatus.filter(
    (character) => character.resourceType === "GRASS",
  ).length;
  const totalWoodCollectors = collectingStatus.filter(
    (character) => character.resourceType === "WOOD",
  ).length;
  const totalStoneCollectors = collectingStatus.filter(
    (character) => character.resourceType === "STONE",
  ).length;
  const totalWaterCollectors = collectingStatus.filter(
    (character) => character.resourceType === "WATER",
  ).length;

  const totalEnergySpent = collectingStatus.reduce((acc, character) => {
    acc += character.energySpent;
    return acc;
  }, 0);

  return {
    totalSheep,
    wolfGambitPercent: `${wolfGambitPercent*100}%`,
    prisonerDelimmaPercent: `${prisonerDelimmaPercent*100}%`,
    totalGrassCollectors,
    totalStoneCollectors,
    totalWaterCollectors,
    totalWoodCollectors,
    totalEnergySpent,
  };
}

async function signMessage() {
  try {
      const token = await Web3Token.sign(
          msg => web3.eth.accounts.sign(msg, `0x${SIGNER_PRIVATE_KEY}`).signature
      ); // Omitting the duration for non-expiry
      return token;
  } catch (error) {
      console.error('Error generating token:', error);
  }
}

export default function handler(req, res) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  console.log('Running Wolf Watcher Cron');

  const web3 = new Web3();

  dotenv.config();

  const TOKEN_ID = process.env.DISCORD_WOLF_BOT_TOKEN;
  const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
  const WOLF_GAME_API_KEY = process.env.WOLF_GAME_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
  const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS;

  console.log('process.env', process.env);

  const woolEmoji = '<:wool:1195863042710319114>';
  // Create a new client instance
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    partials: ["CHANNEL"], // This is required to receive DMs
  });

  client.once(Events.ClientReady, async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    updateActivityStatus(client);
    updatePriceChannel(client);
  });

  // Log in to Discord with your client's token
  client.login(TOKEN_ID);

  res.status(200).end('Task Completed');
};