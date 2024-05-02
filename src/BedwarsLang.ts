export interface BedWarsStrings {
    deathTitle: string;
    deathSubtitle: string;
    spectateTitle: string;
    spectateSubtitle: string;
    respawnTitle: string;
    respawnMessage: string;
    bedDestroyedTitle: string;
    victoryTitle: string;
    bedDestroyedSubtitle: string;
    teamBedDestroyedMessage: string;
    teamEliminationMessage: string;
    finalKillMessage: string;
    breakingBlockInvalidMessage: string;
    killNotification: string;
    finalKillNotification: string;
    disconnectedMessage: string;
    reconnectionMessage: string;
    placingBlockIllagelMessage: string;
    gameEndedMessage: string;
    openEnemyChestMessage: string;
    teamPurchaseMessage: string;
    purchaseMessage: string;
    trapActivatedTitle: string;
    alarmTrapSubtitle: string;
    trapActivatedMessage: string; // sent to players whose team owns the trap
    activatingTrapWarning: string; // sent to player that activates the trap
    languageChangedMessage: string;
    trackerFailedToFindTargetMessage: string;
    trackerChangeTargetMessage: string;
    trackerTrackingNotification: string;

    redName: string;
    blueName: string;
    yellowName: string;
    greenName: string;
    pinkName: string;
    grayName: string;
    cyanName: string;
    whiteName: string;

    ironName: string;
    goldName: string;
    diamondName: string;
    emeraldName: string;

    woodenAxeName: string;
    stoneAxeName: string;
    ironAxeName: string;
    diamondAxeName: string;

    negativeEffectTrapName: string;
    negativeEffectTrapDescription: string;
    defensiveTrapName: string;
    defensiveTrapDescription: string;
    alarmTrapName: string;
    alarmTrapDescription: string;
    minerFatigueTrapName: string;
    minerFatigueTrapDescription: string;

    sharpenedSwordName: string;
    sharpenedSwordBody: string;
    reinforcedArmorName: string;
    reinforcedArmorBody: string;
    ironForgeName: string;
    ironForgeBody: string;
    maniacMinerName: string;
    maniacMinerBody: string;
    healPoolName: string;
    healPoolBody: string;

    itemShopBody: string;
    itemShopTitle: string;
    blocksShopTitle: string;
    blocksShopDisplay: string;
    blocksShopBody: string;
}

// DO NOT CHANGE THE ORDER
export enum Lang {
    en_US,
    zh_CN
}

export const strings: Record<Lang, BedWarsStrings> = Object.create(null);

strings[Lang.en_US] = {
    deathTitle: "§cYOU DIED!",
    deathSubtitle: "§eYou will respawn in §c%d §eseconds!",
    spectateTitle: "§cSPECTATING!",
    spectateSubtitle: "Your bed has been destroyed",
    respawnTitle: "§aRESPAWNED!",
    respawnMessage: "§eYou have respawned!",
    bedDestroyedTitle: "§cBED DESTROYED!",
    victoryTitle: "§6§lVICTORY!",
    bedDestroyedSubtitle: "You will no longer respawn!",
    teamBedDestroyedMessage: "\n§lBED DESTRUCTION > §r%s%s Bed §7was destroyed by %s%s§7!\n ",
    teamEliminationMessage: "\n§lTEAM ELIMINATED > §r%s%s §chas been eliminated!\n ",
    finalKillMessage: "%(victimColor)s%(victim)s §7was killed by %(killerColor)s%(killer)s§7. §b§lFINAL KILL!",
    breakingBlockInvalidMessage: "§cYou cannot break blocks that are not placed by players.",
    killNotification: "§cKILL: %s%s",
    finalKillNotification: "§cFINAL KILL: %s%s",
    disconnectedMessage: "%s%s §7disconnected.",
    reconnectionMessage: "%s%s §ereconnected.",
    placingBlockIllagelMessage: "§cYou can't place blocks here!",
    gameEndedMessage: "\n§lGAME ENDED > §r%s%s §7is the winner!\n",
    openEnemyChestMessage: "§cYou can't open enemy's chest.",
    teamPurchaseMessage: "%s%s §ahas purchased §6%s",
    purchaseMessage: "§aYou purchased §6%s",
    trapActivatedTitle: "§cTRAP ACTIVATED!",
    alarmTrapSubtitle: "%s%s §7has entered your base!",
    trapActivatedMessage: "§7%s §chas been activated!",
    activatingTrapWarning: "§7You have activated §e%s!",
    languageChangedMessage: "§7Your language have been switched to §6English.",
    trackerFailedToFindTargetMessage: "§cFailed to find any enemy to track!",
    trackerChangeTargetMessage: "§6Now tracking %s%s§6.",
    trackerTrackingNotification: "§6TRACKING %s%s §a%d blocks §6§l%s",

    redName: "red",
    blueName: "blue",
    greenName: "green",
    yellowName: "yellow",
    cyanName: "cyan",
    grayName: "gray",
    pinkName: "pink",
    whiteName: "white",

    ironName: " Irons",
    goldName: " Golds",
    diamondName: " Diamonds",
    emeraldName: " Emeralds",

    woodenAxeName: "Wooden Axe",
    stoneAxeName: "Stone Axe",
    ironAxeName: "Iron Axe",
    diamondAxeName: "Diamond Axe",

    negativeEffectTrapName: "It's a Trap!",
    negativeEffectTrapDescription: "§7Inflicts Blindness and Slowness for 8 seconds.",
    defensiveTrapName: "Counter-Offensive Trap",
    defensiveTrapDescription: "§7Grants Speed II and Jump Boost II for 15 seconds to allied players near your base.",
    alarmTrapName: "Alarm Trap",
    alarmTrapDescription: "§7Reveals invisible players as well as their name and team.",
    minerFatigueTrapName: "Miner Fatigue Trap",
    minerFatigueTrapDescription: "§7Inflict Mining Fatigue for 10 seconds.",

    sharpenedSwordName: "Sharpened Sword",
    sharpenedSwordBody: "§7Your team permanently gains sharpness I on all swords!",
    reinforcedArmorName: "Reinforced Armor",
    reinforcedArmorBody: `§7Your team permanently gains Protection on all armor pieces!

§7Tier 1: Protection I, §b2 Diamonds
§7Tier 2: Protection II, §b4 Diamonds
§7Tier 3: Protection III, §b8 Diamonds
§7Tier 4: Protection IV, §b16 Diamonds`,
    ironForgeName: "Iron Forge",
    ironForgeBody: `§7Upgrade resources spawning on your island.

§7Tier 1: +50%% Resources, §b2 Diamonds
§7Tier 2: +100%% Resources, §b4 Diamonds
§7Tier 3: Spawn emeralds, §b6 Diamonds
§7Tier 4: +200%% Resources, §b8 Diamonds`,
    maniacMinerName: "Maniac Miner",
    maniacMinerBody: `§7All players on your team permanently gain Haste

§7Tier 1: Haste I, §b2 Diamonds
§7Tier 2: Haste II, §b4 Diamonds`,
    healPoolName: "Heal Pool",
    healPoolBody: "§7Create a regeneration field around your base!",

    itemShopBody: "Buy items!",
    itemShopTitle: "Bedwars Item Shops",
    blocksShopBody: "Buy blocks",
    blocksShopDisplay: "Blocks",
    blocksShopTitle: "Blocks Shop"
};

strings[Lang.zh_CN] = {
    deathTitle: "§c你死了!",
    deathSubtitle: "§e你将在 §c%d §e秒后重生!",
    spectateTitle: "§c你已进入观察者模式!",
    spectateSubtitle: "你的床已被摧毁",
    respawnTitle: "§a你已重生!",
    respawnMessage: "§e你已重生!",
    bedDestroyedTitle: "§c床被摧毁!",
    victoryTitle: "§6§l胜利!",
    bedDestroyedSubtitle: "你将无法重生!",
    teamBedDestroyedMessage: "\n§l床被摧毁 > §r%s%s的床 §7被 %s%s§7 摧毁!\n ",
    teamEliminationMessage: "\n§l队伍淘汰 > §r%s%s §c已被淘汰!\n ",
    finalKillMessage: "%(victimColor)s%(victim)s §7被 %(killerColor)s%(killer)s§7 击杀。 §b§l最终击杀!",
    breakingBlockInvalidMessage: "§c你不能破坏非玩家放置的方块。",
    killNotification: "§c击杀: %s%s",
    finalKillNotification: "§c最终击杀: %s%s",
    disconnectedMessage: "%s%s §7断开了连接。",
    reconnectionMessage: "%s%s §e重新连接。",
    placingBlockIllagelMessage: "§c你不能在这里放置方块!",
    gameEndedMessage: "\n§l游戏结束 > §r%s%s §7胜利!\n",
    openEnemyChestMessage: "§c你不能打开敌队的箱子。",
    teamPurchaseMessage: "%s%s §a购买了 §6%s",
    purchaseMessage: "§a你购买了 §6%s",
    trapActivatedTitle: "§c陷阱触发!",
    alarmTrapSubtitle: "%s%s §7进入了你的基地!",
    trapActivatedMessage: "§7%s §c被激活了!",
    activatingTrapWarning: "§7你激活了 §e%s!",
    languageChangedMessage: "§7你的语言已被设置为§6简体中文。",
    trackerFailedToFindTargetMessage: "§c没有可以追踪的敌人!",
    trackerChangeTargetMessage: "§6正在追踪 %s%s§6。",
    trackerTrackingNotification: "§6追踪 %s%s §a%d米 §6§l%s",

    redName: "红",
    blueName: "蓝",
    greenName: "绿",
    yellowName: "黄",
    cyanName: "青",
    grayName: "灰",
    pinkName: "粉",
    whiteName: "白",

    ironName: "铁",
    goldName: "金",
    diamondName: "钻石",
    emeraldName: "绿宝石",

    woodenAxeName: "木斧",
    stoneAxeName: "石斧",
    ironAxeName: "铁斧",
    diamondAxeName: "钻石斧",

    negativeEffectTrapName: "这是一个陷阱!",
    negativeEffectTrapDescription: "§7给敌人8秒的失明与缓慢。",
    defensiveTrapName: "反攻陷阱",
    defensiveTrapDescription: "§7给予基地的队友15秒的速度II与跳跃提升II。",
    alarmTrapName: "报警陷阱",
    alarmTrapDescription: "§7破除隐身玩家的隐身效果，展示其名称与队伍。",
    minerFatigueTrapName: "挖掘疲劳陷阱",
    minerFatigueTrapDescription: "§7给予敌人10秒的挖掘疲劳。",

    sharpenedSwordName: "锋利",
    reinforcedArmorName: "加强盔甲",
    sharpenedSwordBody: "§7你的队伍永久获得在剑上获得锋利I!",
    reinforcedArmorBody: `§7你的队伍永久在所有盔甲上获得保护

§7第1等级: 保护 I, §b需2个钻石
§7第2等级: 保护 II, §b需4个钻石
§7第3等级: 保护 III, §b需8个钻石
§7第4等级: 保护 IV, §b需16个钻石`,
    ironForgeName: "铁熔炉",
    ironForgeBody: `§7升级队伍岛屿的资源。

§7第1等级: +50%% 资源, §b需2个钻石
§7第2等级: +100%% 资源, §b需4个钻石
§7第3等级: 产生绿宝石, §b需6个钻石
§7第4等级: +200%% 资源, §b需8个钻石`,
    maniacMinerName: "疯狂矿工",
    maniacMinerBody: `§7你的队伍获得永久急迫

§7第1等级: 急迫 I, §b需2个钻石
§7第2等级: 急迫 II, §b需4个钻石`,
    healPoolName: "治疗池",
    healPoolBody: "§7在基地周围给予你的队伍生命恢复效果",

    itemShopBody: "买点物品!",
    itemShopTitle: "起床战争物品商店",
    blocksShopBody: "买一些方块！",
    blocksShopDisplay: "方块",
    blocksShopTitle: "方块商店"
};
