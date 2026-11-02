export type NFTCategory = "all" | "diamond" | "paperhand" | "gas";

export type NFTMoment = {
  id: string;
  name: string;
  collection: string;
  badge: "💎 Diamond Hand ($0)" | "🧻 Paperhand (Too Early)" | "⛽ Gas War Casualty";
  category: "diamond" | "paperhand" | "gas";
  year: string;
  chain: "Ethereum" | "Solana";
  buyPrice: string;
  exitPrice: string;
  peakPrice?: string;
  pnl: string;
  pnlType: "loss" | "missed";
  story: string;
  lesson: string;
};

export const NFT_JOURNEY_STATS = {
  totalBurnedEstimate: "~$34,500+",
  ethBurned: "8.4 ETH",
  solBurned: "65 SOL",
  zeroHoldRate: "100%",
  expensiveLesson: "Real utility > Speculative hype",
};

export const NFT_MOMENTS: NFTMoment[] = [
  {
    id: "pixel-metaverse",
    name: "The 'Metaverse MMO' Mirage",
    collection: "Generative 3D Avatars",
    badge: "💎 Diamond Hand ($0)",
    category: "diamond",
    year: "2021-2022",
    chain: "Ethereum",
    buyPrice: "3.2 ETH (~$9,800)",
    exitPrice: "0.04 ETH (~$75)",
    pnl: "-99.2% (-$9,725)",
    pnlType: "loss",
    story:
      "Fell head over heels for a cinematic CGI trailer and an 80-page whitepaper promising a decentralized open world. Sat in Discord for 9 months reacting with diamond and rocket emojis while the founders tweeted concept art of virtual grass. Held through the peak with unflinching conviction straight into complete illiquidity.",
    lesson:
      "A 3D Blender trailer is not an economic moat. If the team spends more time hyping Discord roles than writing backend code, you are not an early adopter—you are the exit liquidity.",
  },
  {
    id: "solana-bluechip-dump",
    name: "The Lunch Money Paperhand",
    collection: "Early Solana Genesis Mint",
    badge: "🧻 Paperhand (Too Early)",
    category: "paperhand",
    year: "Late 2021",
    chain: "Solana",
    buyPrice: "1.8 SOL (~$72)",
    exitPrice: "2.4 SOL (~$96)",
    peakPrice: "220 SOL (~$35,200)",
    pnl: "+$24 gain (Missed ~$35,100)",
    pnlType: "missed",
    story:
      "Woke up at 4 AM to mint on Phantom. Floor jumped 30% in 48 hours. Trembling hands clicked 'List Now' to lock in a $24 profit and celebrate with a modest burger. Two weeks later, the collection became a global Solana icon, floor went vertical to 220 SOL, and holders were getting invited to private yacht parties in Lisbon.",
    lesson:
      "Sold generational asymmetric upside to de-risk pocket change. Selling 100% of an organic cult at the first twitch of profit is pure paperhand psychology.",
  },
  {
    id: "discord-family-rug",
    name: "The 'We Are Family' Rug",
    collection: "Stealth PFP DAO",
    badge: "💎 Diamond Hand ($0)",
    category: "diamond",
    year: "2022",
    chain: "Ethereum",
    buyPrice: "1.9 ETH (~$5,700)",
    exitPrice: "0.00 ETH",
    pnl: "-100% (-$5,700)",
    pnlType: "loss",
    story:
      "The roadmap had everything: native staking, tokenomics, IRL meetups in Miami, and a private incubator. The anonymous moderators called everyone 'fren' and banned anyone who asked where the treasury funds were held. One Tuesday morning, the Discord server vanished, the Twitter account became a spam casino bot, and the floor bid was literally zero.",
    lesson:
      "When an anonymous Web3 founder refers to their retail investors as 'family', hold onto your wallet. Community sentiment without code commits is just a waiting room for a rug pull.",
  },
  {
    id: "gwei-warfare",
    name: "The 400 Gwei Gas War Disaster",
    collection: "Hype Contract Stealth Drop",
    badge: "⛽ Gas War Casualty",
    category: "gas",
    year: "2021 NFT Summer",
    chain: "Ethereum",
    buyPrice: "0.2 ETH Mint + 0.95 ETH Gas ($3,800)",
    exitPrice: "0.05 ETH ($90)",
    pnl: "-97.6% (-$3,710)",
    pnlType: "loss",
    story:
      "Cranked priority gas to 420 Gwei at 2:30 AM to beat the mempool front-running bots. Transaction confirmed! Felt like a cyber warrior. Reveal day arrived 48 hours later: the metadata was broken, the art was an off-center pixel clone, and the highest bid on OpenSea was lower than what I paid in Ethereum validator fees alone.",
    lesson:
      "The Ethereum validators and block builders were the only actual winners in the NFT bull run. Don't pay $1,000 in gas to race for an asset that hasn't proven it deserves to exist.",
  },
];
