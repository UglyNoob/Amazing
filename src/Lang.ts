import * as mc from "@minecraft/server";
export interface Strings {
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
    placeBlockIllagelMessage: string;
    placeBlockOutOfMapMessage: string;
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
    bedProtectionDisabledMessage: string;
    bedAreProtectedMessage: string;
    trackerTrackingNotification: string;
    teamInformationNotification: string;
    killCountNotification: string;
    finalKillCountNotification: string;
    bedDestroyedCountNotification: string;
    wolfStartGuardingNotification: string;
    wolfStopGuardingNotification: string;

    teamChatPrefix: string;
    globalChatPrefix: string;
    spectatorChatPrefix: string;

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
    axeMaxLevelString: string;

    leatherArmorName: string;
    chainmailArmorName: string;
    ironArmorName: string;
    diamondArmorName: string;

    woodenPickaxeName: string;
    ironPickaxeName: string;
    goldenPickaxeName: string;
    diamondPickaxeName: string;
    pickaxeMaxLevelString: string;

    woodenSwordName: string;
    stoneSwordName: string;
    ironSwordName: string;
    diamondSwordName: string;

    woolName: string;
    hardenedClayName: string;
    blastProofGlassName: string;
    plankName: string;
    endStoneName: string;
    ladderName: string;
    obsidianName: string;
    fireBallName: string;
    windChargeName: string;
    knockbackStickName: string;
    shearsName: string;
    itemAlreadyHaveString: string;
    invisiblePotionName: string;
    jumpPotionName: string;
    speedPotionName: string;
    arrowName: string;
    bowName: string;
    bowPowerIName: string;
    bowPowerIPunchIName: string;
    goldenAppleName: string;
    enderPearlName: string;
    bridgeEggName: string;
    trackerName: string;
    totemOfUndyingName: string;
    loyalWolfName: string;
    wolfArmorName: string;
    rescuePlatformName: string;

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

    backButtonDisplay: string;
    successString: string;
    actionFailedString: string;

    itemShopBody: string;
    itemShopTitle: string;
    blockShopTitle: string;
    blockShopDisplay: string;
    blockShopBody: string;
    weaponShopTitle: string;
    weaponShopDisplay: string;
    weaponShopBody: string;
    armorsShopTitle: string;
    armorsShopDisplay: string;
    armorsShopBody: string;
    toolShopTitle: string;
    toolShopDisplay: string;
    toolShopBody: string;
    potionShopTitle: string;
    potionShopDisplay: string;
    potionShopBody: string;
    bowShopTitle: string;
    bowShopDisplay: string;
    bowShopBody: string;
    utilityShopTitle: string;
    utilityShopDisplay: string;
    utilityShopBody: string;

    teamShopTitle: string;
    teamShopBody: string;
    trapShopDisplay: string;
    trapShopTitle: string;
    trapShopBody: string;
    trapReachingMaximumString: string;
    trapsViewingMenuBody0: string;
    trapsViewingMenuBody1: string;
    firstString: string;
    secondString: string;
    thirdString: string;
    fourthString: string;
    fifthString: string;
    noTrapString: string;

    platformCooldownNotification: string;
    platformFailedToDeployNotification: string;

    bedwarsSettingTitle: string;

    teleportMenuTitle: string;
    teleportMenuBody: string;
    unableToUseTeleportMenuMessage: string;
    noAvailablePlayerToTeleportMessage: string;
    closeChatMenuMessage: string;
    teleportTargetDeadMessage: string;
    teleportCommandNotification: string;
}

// DO NOT CHANGE THE ORDER
export enum Lang {
    en_US,
    zh_CN
}

export const strings: Record<Lang, Strings> = Object.create(null);

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
    placeBlockIllagelMessage: "§cYou can't place blocks here!",
    placeBlockOutOfMapMessage: "§cYou can't place block outside the map!",
    gameEndedMessage: "\n§lGAME ENDED > §r%s%s §7is the winner!\n",
    openEnemyChestMessage: "§cYou cannot open enemy's chest while there are still alive players on that team!",
    teamPurchaseMessage: "%s%s §ahas purchased §6%s",
    purchaseMessage: "§aYou purchased §6%s",
    trapActivatedTitle: "§cTRAP TRIGGERED!",
    alarmTrapSubtitle: "%s%s §7has entered your base!",
    trapActivatedMessage: "§7%s §chas been activated!",
    activatingTrapWarning: "§7You have activated §e%s!",
    languageChangedMessage: "§7Your language have been switched to §6English§7.",
    trackerFailedToFindTargetMessage: "§cFailed to find any enemy to track!",
    trackerChangeTargetMessage: "§6Now tracking %s%s§6.",
    trackerTrackingNotification: "§6TRACKING %s%s §a%d blocks §6§l%s",
    bedProtectionDisabledMessage: "§cBeds are now breakable!",
    bedAreProtectedMessage: "§6Beds are protected currently.",
    teamInformationNotification: "§7Your Team: %s%s",
    killCountNotification: "§7Kills: §a%d",
    finalKillCountNotification: "§7Final Kills: §a%d",
    bedDestroyedCountNotification: "§7Destroyed Beds: §a%d",
    wolfStartGuardingNotification: "§6Your wolf is now guarding.",
    wolfStopGuardingNotification: "§7Your wolf stops guarding.",

    teamChatPrefix: "§3[TEAM]§r",
    globalChatPrefix: "§6[GLOBAL]§r",
    spectatorChatPrefix: "§1[SPECTATOR]§r",

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
    axeMaxLevelString: "Your axe is\nof the max level.",

    leatherArmorName: "Leather Armors",
    chainmailArmorName: "Chainmail Armors",
    ironArmorName: "Iron Armors",
    diamondArmorName: "Diamond Armors",

    woodenPickaxeName: "Wooden Pickaxe",
    ironPickaxeName: "Iron Pickaxe",
    goldenPickaxeName: "Golden Pickaxe",
    diamondPickaxeName: "Diamond Pickaxe",
    pickaxeMaxLevelString: "Your pickaxe is\nof the max level.",

    woodenSwordName: "Wooden Sword",
    stoneSwordName: "Stone Sword",
    ironSwordName: "Iron Sword",
    diamondSwordName: "Diamond Sword",

    woolName: "Wool",
    hardenedClayName: "Hardened Clay",
    blastProofGlassName: "Blast-Proof Glass",
    plankName: "Plank",
    endStoneName: "End Stone",
    ladderName: "Ladder",
    obsidianName: "Obsidian",
    fireBallName: "Fire Ball",
    windChargeName: "Wind Charge",
    knockbackStickName: "Knockback Stick",
    shearsName: "Shears",
    itemAlreadyHaveString: "You already have this item.",
    invisiblePotionName: "Invisibility Potion (0:30)",
    jumpPotionName: "Jump V Potion (0:45)",
    speedPotionName: "Speed II Potion (0:45)",
    arrowName: "Arrow",
    bowName: "Bow",
    bowPowerIName: "Bow Power I",
    bowPowerIPunchIName: "Bow Power I,Punch I",
    goldenAppleName: "Golden Apple",
    enderPearlName: "Ender Pearl",
    bridgeEggName: "Bridge Egg",
    trackerName: "Tracker",
    totemOfUndyingName: "Totem of Undying",
    loyalWolfName: "Loyal Wolf",
    wolfArmorName: "Wolf Armor",
    rescuePlatformName: "Rescue Platform",

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

    backButtonDisplay: "Back",
    successString: "§aSuccess!",
    actionFailedString: "§cAction failed.",

    itemShopBody: "Buy items!",
    itemShopTitle: "Bedwars Item Shops",
    blockShopBody: "Buy blocks",
    blockShopDisplay: "Blocks",
    blockShopTitle: "Blocks Shop",
    weaponShopTitle: "Weapon Shop",
    weaponShopDisplay: "Weapons",
    weaponShopBody: "Buy weapons.",
    armorsShopTitle: "Armors Shop",
    armorsShopDisplay: "Armors",
    armorsShopBody: "Buy armors.",
    toolShopTitle: "Tool shop",
    toolShopDisplay: "Tools",
    toolShopBody: "Buy tools.",
    potionShopTitle: "Potion Shop",
    potionShopDisplay: "Potions",
    potionShopBody: "Buy potions.",
    bowShopTitle: "Bow Shop",
    bowShopDisplay: "Bows",
    bowShopBody: "Buy bows.",
    utilityShopTitle: "Utility Shop",
    utilityShopDisplay: "Utilities",
    utilityShopBody: "Buy utilities.",

    teamShopTitle: "Team Upgrade",
    teamShopBody: "Upgrade for the team.",
    trapShopDisplay: "Traps",
    trapShopTitle: "Trap Shop",
    trapShopBody: "Buy some traps for your team.",
    trapReachingMaximumString: "Your team's traps reach the maximum.",
    trapsViewingMenuBody0: "§7Your team currently has:\n\n",
    trapsViewingMenuBody1: "§7Trap #%d: §a%s§7, activates when the %s enemy walks into your base\n",
    firstString: "first",
    secondString: "second",
    thirdString: "third",
    fourthString: "fourth",
    fifthString: "fifth",
    noTrapString: "§cNo Trap",

    platformCooldownNotification: "§cPlease wait for §g%s §cseconds",
    platformFailedToDeployNotification: "§cCannot deploy platform here",

    bedwarsSettingTitle: "Bedwars Settings",

    teleportMenuTitle: "Teleport",
    teleportMenuBody: "Choose a player to teleport to",
    unableToUseTeleportMenuMessage: "§cOnly spectators are able to use this command.",
    noAvailablePlayerToTeleportMessage: "§cThere is no players to teleport to currently.",
    closeChatMenuMessage: "§6Please close the chat menu.",
    teleportTargetDeadMessage: "%s §6is not alive. Teleporting you to the death location...",
    teleportCommandNotification: '§6Type "#tp" to teleport to other players.'
};

strings[Lang.zh_CN] = {
    deathTitle: "§c你死了！",
    deathSubtitle: "§e你将在 §c%d §e秒后重生！",
    spectateTitle: "§c你已进入观察者模式！",
    spectateSubtitle: "你的床已被摧毁",
    respawnTitle: "§a你已重生！",
    respawnMessage: "§e你已重生！",
    bedDestroyedTitle: "§c床被摧毁！",
    victoryTitle: "§6§l胜利！",
    bedDestroyedSubtitle: "你将无法重生！",
    teamBedDestroyedMessage: "\n§l床被摧毁 > §r%s%s的床 §7被 %s%s§7 摧毁！\n ",
    teamEliminationMessage: "\n§l队伍淘汰 > §r%s%s §c已被淘汰！\n ",
    finalKillMessage: "%(victimColor)s%(victim)s §7被 %(killerColor)s%(killer)s§7 击杀。 §b§l最终击杀！",
    breakingBlockInvalidMessage: "§c你不能破坏非玩家放置的方块。",
    killNotification: "§c击杀: %s%s",
    finalKillNotification: "§c最终击杀: %s%s",
    disconnectedMessage: "%s%s §7断开了连接。",
    reconnectionMessage: "%s%s §e重新连接。",
    placeBlockIllagelMessage: "§c你不能在这里放置方块！",
    placeBlockOutOfMapMessage: "§c你不能在地图外放方块！",
    gameEndedMessage: "\n§l游戏结束 > §r%s%s §7胜利！\n",
    openEnemyChestMessage: "§c你不能在敌队仍有玩家时打开敌队的箱子。",
    teamPurchaseMessage: "%s%s §a购买了 §6%s",
    purchaseMessage: "§a你购买了 §6%s",
    trapActivatedTitle: "§c陷阱触发！",
    alarmTrapSubtitle: "%s%s §7进入了你的基地！",
    trapActivatedMessage: "§7%s §c被激活了！",
    activatingTrapWarning: "§7你激活了 §e%s！",
    languageChangedMessage: "§7你的语言已被设置为§6简体中文§7。",
    trackerFailedToFindTargetMessage: "§c没有可以追踪的敌人！",
    trackerChangeTargetMessage: "§6正在追踪 %s%s§6。",
    trackerTrackingNotification: "§6追踪 %s%s §a%d米 §6§l%s",
    bedProtectionDisabledMessage: "§c床的保护已消失！",
    bedAreProtectedMessage: "§6床目前受到保护。",
    teamInformationNotification: "§7你的队伍：%s%s队",
    killCountNotification: "§7击杀数：§a%d",
    finalKillCountNotification: "§7最终击杀数：§a%d",
    bedDestroyedCountNotification: "§7摧毁床数：§a%d",
    wolfStartGuardingNotification: "§6你的狼正在防守。",
    wolfStopGuardingNotification: "§7你的狼已停止防守。",

    teamChatPrefix: "§3[队伍]§r",
    globalChatPrefix: "§6[全局]§r",
    spectatorChatPrefix: "§1[观察者]§r",

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
    axeMaxLevelString: "你的斧子已达到最大等级。",

    leatherArmorName: "皮革护甲",
    chainmailArmorName: "锁链护甲",
    ironArmorName: "铁护甲",
    diamondArmorName: "钻石护甲",

    woodenPickaxeName: "木稿",
    ironPickaxeName: "铁稿",
    goldenPickaxeName: "金稿",
    diamondPickaxeName: "钻石镐",
    pickaxeMaxLevelString: "你的稿子已达到最大等级。",

    woodenSwordName: "木剑",
    stoneSwordName: "石剑",
    ironSwordName: "铁剑",
    diamondSwordName: "钻剑",

    woolName: "羊毛",
    hardenedClayName: "硬化黏土",
    blastProofGlassName: "防爆玻璃",
    plankName: "木板",
    endStoneName: "末地石",
    ladderName: "梯子",
    obsidianName: "黑曜石",
    fireBallName: "火球",
    windChargeName: "风弹",
    knockbackStickName: "击退棒",
    shearsName: "剪刀",
    itemAlreadyHaveString: "你已经拥有这项物品。",
    invisiblePotionName: "隐身药水 (0:30)",
    jumpPotionName: "跳跃提升V药水 (0:45)",
    speedPotionName: "速度II药水 (0:45)",
    arrowName: "箭",
    bowName: "弓",
    bowPowerIName: "弓 力量I",
    bowPowerIPunchIName: "弓 力量I，冲击I",
    goldenAppleName: "金苹果",
    enderPearlName: "末影珍珠",
    bridgeEggName: "搭桥蛋",
    trackerName: "追踪器",
    totemOfUndyingName: "不死图腾",
    loyalWolfName: "忠诚的狼",
    wolfArmorName: "狼甲",
    rescuePlatformName: "救援平台",

    negativeEffectTrapName: "这是一个陷阱！",
    negativeEffectTrapDescription: "§7给敌人8秒的失明与缓慢。",
    defensiveTrapName: "反攻陷阱",
    defensiveTrapDescription: "§7给予基地的队友15秒的速度II与跳跃提升II。",
    alarmTrapName: "报警陷阱",
    alarmTrapDescription: "§7破除隐身玩家的隐身效果，展示其名称与队伍。",
    minerFatigueTrapName: "挖掘疲劳陷阱",
    minerFatigueTrapDescription: "§7给予敌人10秒的挖掘疲劳。",

    sharpenedSwordName: "锋利",
    reinforcedArmorName: "加强盔甲",
    sharpenedSwordBody: "§7你的队伍永久获得在剑上获得锋利I！",
    reinforcedArmorBody: `§7你的队伍永久在所有盔甲上获得保护

§7第1等级： 保护 I， §b需2个钻石
§7第2等级： 保护 II， §b需4个钻石
§7第3等级： 保护 III， §b需8个钻石
§7第4等级： 保护 IV， §b需16个钻石`,
    ironForgeName: "铁锻炉",
    ironForgeBody: `§7升级队伍岛屿的资源

§7第1等级： +50%% 资源， §b需2个钻石
§7第2等级： +100%% 资源， §b需4个钻石
§7第3等级： 产生绿宝石， §b需6个钻石
§7第4等级： +200%% 资源， §b需8个钻石`,
    maniacMinerName: "疯狂矿工",
    maniacMinerBody: `§7你的队伍获得永久急迫

§7第1等级： 急迫 I， §b需2个钻石
§7第2等级： 急迫 II， §b需4个钻石`,
    healPoolName: "治疗池",
    healPoolBody: "§7在基地周围给予你的队伍生命恢复效果",

    backButtonDisplay: "返回",
    successString: "§a成功！",
    actionFailedString: "§c购买失败。",

    itemShopBody: "购买物品。",
    itemShopTitle: "起床战争物品商店",
    blockShopBody: "买一些方块！",
    blockShopDisplay: "方块",
    blockShopTitle: "方块商店",
    weaponShopTitle: "武器商店",
    weaponShopDisplay: "武器",
    weaponShopBody: "购买武器。",
    armorsShopTitle: "护甲商店",
    armorsShopDisplay: "护甲",
    armorsShopBody: "购买护甲。",
    toolShopTitle: "工具商店",
    toolShopDisplay: "工具",
    toolShopBody: "购买工具。",
    potionShopTitle: "药水商店",
    potionShopDisplay: "药水",
    potionShopBody: "购买药水。",
    bowShopTitle: "弓商店",
    bowShopDisplay: "弓",
    bowShopBody: "购买弓与箭。",
    utilityShopTitle: "杂货商店",
    utilityShopDisplay: "杂项",
    utilityShopBody: "购买其他物品。",

    teamShopTitle: "队伍升级",
    teamShopBody: "为你的队伍升级。",
    trapShopDisplay: "陷阱",
    trapShopTitle: "陷阱商店",
    trapShopBody: "购买陷阱。",
    trapReachingMaximumString: "你的队伍的陷阱已达到上限。",
    trapsViewingMenuBody0: "§7你的队伍当前有：\n\n",
    trapsViewingMenuBody1: "§7陷阱 #%d： §a%s§7，当%s敌人进入你的基地时激活\n",
    firstString: "第一个",
    secondString: "第二个",
    thirdString: "第三个",
    fourthString: "第四个",
    fifthString: "第五个",
    noTrapString: "§c无",

    platformCooldownNotification: "§c请等待§g%s§c秒",
    platformFailedToDeployNotification: "§c无法在这里放置救援平台",

    bedwarsSettingTitle: "起床战争设置",

    teleportMenuTitle: "传送菜单",
    teleportMenuBody: "选择要传送的玩家",
    unableToUseTeleportMenuMessage: "§c只有观察者能使用此指令。",
    noAvailablePlayerToTeleportMessage: "§c当前五可以传送的玩家。",
    closeChatMenuMessage: "§6请关闭聊天窗口。",
    teleportTargetDeadMessage: "%s §6已死亡，传送至死亡地点。",
    teleportCommandNotification: '§6输入“#tp”以传送至其他玩家'
};


export function getPlayerLang(player: mc.Player) {
    let result = player.getDynamicProperty("LANG_PREFERENCE") as Lang;
    if (result == null) {
        player.setDynamicProperty("LANG_PREFERENCE", Lang.en_US);
        result = Lang.en_US;
    }
    return result;
}

export function setPlayerLang(player: mc.Player, lang: Lang) {
    player.setDynamicProperty("LANG_PREFERENCE", lang);
}

export function fixPlayerSettings(player: mc.Player) {
    player.getDynamicProperty("LANG_PREFERENCE") ?? player.setDynamicProperty("LANG_PREFERENCE", Lang.en_US);
}

