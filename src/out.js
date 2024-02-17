(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // scripts/utility.js
  function normalize({ x = 0, y = 0, z = 0 }) {
    let mod = Math.sqrt(x * x + y * y + z * z);
    return { x: x / mod, y: y / mod, z: z / mod };
  }
  function realTypeof(value) {
    return value === null ? "null" : typeof value;
  }
  function getGameMode(player2) {
    for (let gameMode of Object.values(mc2.GameMode)) {
      if (player2.matches({ gameMode }))
        return gameMode;
    }
  }
  function showObjectToPlayer(player2, object) {
    async function _showObjectToPlayer(player3, object2, derivedObject) {
      let data2 = new ui.ActionFormData();
      let type = realTypeof(object2);
      if (type != "object" && type != "function") {
        data2.title(`Primitive ${type}`);
        data2.body(`\xA7b${object2}`);
        data2.button("\xA7mBack\u2192");
        let response2 = await data2.show(player3);
        return response2.canceled;
      }
      let getObjectName = (obj) => obj?.constructor?.name ?? "Object";
      let objectName = getObjectName(object2);
      data2.title(objectName);
      data2.button("\xA71See Prototype");
      let hasBackButton = !!derivedObject;
      hasBackButton && data2.button("\xA7mBack\u2192");
      let bodyText = `\xA7pContent of \xA7n${objectName}\xA7p:`;
      let childObjects = [];
      let childFunctions = [];
      let childFunctionNames = [];
      for (let key of Object.getOwnPropertyNames(object2)) {
        let value = Reflect.get(object2, key, derivedObject ?? object2);
        let valueType = realTypeof(value);
        if (valueType == "function") {
          childFunctionNames.push(key);
          childFunctions.push(value);
        } else if (valueType != "object") {
          bodyText = bodyText.concat(`
\xA76Property \xA7e${key}\xA76 as \xA7a${valueType}\xA76: \xA7b${value}`);
        } else {
          childObjects.push(value);
          data2.button(`\xA7n${getObjectName(value)} \xA7e${key}`);
        }
      }
      for (let name of childFunctionNames) {
        data2.button(`\xA7sFunction \xA7e${name}`);
      }
      data2.body(bodyText);
      while (true) {
        let response2 = await data2.show(player3);
        if (response2.canceled)
          return true;
        if (response2.selection == 0) {
          let result2 = await _showObjectToPlayer(player3, Object.getPrototypeOf(object2), derivedObject ?? object2);
          if (result2)
            return true;
        } else if (response2.selection == 1 && hasBackButton) {
          return false;
        } else {
          let childIndex = hasBackButton ? response2.selection - 2 : response2.selection - 1;
          if (childIndex >= childObjects.length) {
            let child = childFunctions[childIndex - childObjects.length];
            let result2 = await _showObjectToPlayer(player3, child?.prototype, child?.prototype);
            if (result2)
              return true;
          } else {
            let child = childObjects[childIndex];
            let result2 = await _showObjectToPlayer(player3, child, child);
            if (result2)
              return true;
          }
        }
      }
    }
    _showObjectToPlayer(player2, object, null);
  }
  function defineEnum(elements) {
    return elements.reduce((result2, value, index) => {
      result2[result2[index] = value] = index;
      return result2;
    }, {});
  }
  var mc2, ui;
  var init_utility = __esm({
    "scripts/utility.js"() {
      mc2 = __toESM(__require("@minecraft/server"));
      ui = __toESM(__require("@minecraft/server-ui"));
    }
  });

  // scripts/DebugStick.js
  var require_DebugStick = __commonJS({
    "scripts/DebugStick.js"(exports, module) {
      var mc7 = __toESM(__require("@minecraft/server"));
      var ui2 = __toESM(__require("@minecraft/server-ui"));
      init_utility();
      mc7.world.beforeEvents.itemUse.subscribe((event) => {
        if (event.itemStack.nameTag === "Debug Stick") {
          if (!event.source.isOp())
            return;
          event.cancel = true;
          let data = new ui2.ModalFormData();
          data.title("Debug Stick");
          data.textField("Enter expersion", "expersion...");
          mc7.system.run(() => data.show(event.source).then((response) => {
            if (response.canceled)
              return;
            try {
              let result = eval(response.formValues[0]);
              showObjectToPlayer(event.source, result);
            } catch (e) {
              event.source.sendMessage(`\xA7c${e.name}: ${e.message}
${e?.stack}`);
            }
          }));
        }
      });
    }
  });

  // scripts/polyfill.js
  var mc = __toESM(__require("@minecraft/server"));
  if (!mc.Container.prototype[Symbol.iterator])
    mc.Container.prototype[Symbol.iterator] = function* () {
      for (let i = 0; i < this.size; ++i) {
        yield this.getItem(i);
      }
    };

  // scripts/KnockbackStick.js
  init_utility();
  var mc3 = __toESM(__require("@minecraft/server"));
  var THE_STICK_ITEM = (() => {
    let item = new mc3.ItemStack("minecraft:stick", 1);
    item.nameTag = "\xA7r\xA7eA Regular Stick";
    item.setLore(["", "\xA7r\xA7bThis stick has \xA7g\xA7oSUPER POWER\xA7r\xA7b.", "\xA7rDon't craft with it! Try using it on somewhere."]);
    return item;
  })();
  function isTheStick(item) {
    return item.getLore()[1] == THE_STICK_ITEM.getLore()[1];
  }
  var POWER_COOLDOWN = 50;
  var POWER_EFFECTS_RAMGE = 5;
  var POWER_SLOWNESS_EFFECT_DURATION = 15;
  var powerCooldownSymbol = Symbol("powerCooldown");
  var POWER_IGNORES = [
    "minecraft:leash_knot",
    "minecraft:thrown_trident",
    "minecraft:small_fireball",
    "minecraft:fireball",
    "minecraft:evocation_fang"
  ];
  function performPower(player2) {
    let dimension = player2.dimension;
    let entities = player2.dimension.getEntities({
      location: player2.location,
      maxDistance: POWER_EFFECTS_RAMGE
    }).filter((entity) => entity != player2 && !POWER_IGNORES.includes(entity.typeId));
    for (let entity of entities) {
      let isApplied = false;
      try {
        let vector = normalize({
          x: entity.location.x - player2.location.x,
          y: entity.location.y - player2.location.y + 0.4,
          z: entity.location.z - player2.location.z
        });
        for (let i in vector)
          vector[i] *= 2.5;
        entity.applyImpulse(vector);
        isApplied = true;
      } catch {
        try {
          let { x, z } = normalize({
            x: entity.location.x - player2.location.x,
            z: entity.location.z - player2.location.z
          });
          entity.applyKnockback(x, z, 4, 0.7);
          isApplied = true;
        } catch {
        }
      }
      if (isApplied) {
        let times = 5;
        mc3.system.run(function temp() {
          let location;
          try {
            location = entity.location;
          } catch {
            return;
          }
          location.y += 0.2;
          dimension.spawnParticle("minecraft:large_explosion", location);
          if (--times != 0)
            mc3.system.runTimeout(temp, 2);
        });
      }
    }
    player2.addEffect("slowness", POWER_SLOWNESS_EFFECT_DURATION, { amplifier: 1, showParticles: false });
    mc3.world.playSound("mob.enderdragon.flap", player2.location);
  }
  mc3.world.beforeEvents.itemUse.subscribe((event2) => {
    switch (event2.itemStack.typeId) {
      case "minecraft:diamond":
        let inventory = event2.source.getComponent("minecraft:inventory").container;
        for (let item of inventory) {
          if (!item)
            continue;
          if (isTheStick(item))
            return;
        }
        mc3.system.run(() => inventory.addItem(THE_STICK_ITEM));
        break;
      case "minecraft:stick":
        if (isTheStick(event2.itemStack))
          mc3.system.run(() => {
            let player2 = event2.source;
            let cooldown = player2[powerCooldownSymbol];
            if (cooldown === void 0)
              return;
            if (cooldown != 0) {
              player2.onScreenDisplay.setActionBar(`\xA71\xA7lThe power is still under emerging... ${(cooldown / 20).toFixed(1)}s`);
              return;
            }
            performPower(player2);
            player2.onScreenDisplay.setTitle(" ", {
              stayDuration: 5,
              fadeInDuration: 0,
              fadeOutDuration: 10,
              subtitle: "\xA7c\xA7lYou have released the power!"
            });
            player2[powerCooldownSymbol] = POWER_COOLDOWN;
          });
        break;
    }
  });
  mc3.system.runInterval(() => {
    for (let player2 of mc3.world.getAllPlayers()) {
      if (player2[powerCooldownSymbol] === void 0) {
        player2[powerCooldownSymbol] = 0;
        player2.sendMessage("\xA7gGrab a diamond and use it. Feel if there is some power inside.");
      }
      if (player2[powerCooldownSymbol] > 0)
        --player2[powerCooldownSymbol];
      if (mc3.system.currentTick % 4 == 0) {
        let inventory = player2.getComponent("minecraft:inventory").container;
        let selectedItem = inventory.getItem(player2.selectedSlot);
        if (selectedItem && isTheStick(selectedItem)) {
          if (player2[powerCooldownSymbol] == 0)
            player2.onScreenDisplay.setActionBar("\xA7b\xA7lThe \xA7mpower \xA7bis ready");
          else
            player2.onScreenDisplay.setActionBar(`\xA71\xA7lThe power is still under emerging... ${(player2[powerCooldownSymbol] / 20).toFixed(1)}s`);
        }
      }
    }
  });

  // scripts/FireSword.js
  var mc4 = __toESM(__require("@minecraft/server"));
  var FIRESOWRD_LORE_DESCRIPTION = "\xA7r\xA74This sword understands fire.";
  var CONVERT_ITEM_ID = "minecraft:nether_star";
  var CONVERT_DISTANCE = 0.35;
  var FIRESWORD_NAMETAG = "\xA7r\xA7c\xA7lFire Sword";
  var fireSwordCooldownSymbol = Symbol("cooldown");
  var fireSwordMaxCooldownSymbol = Symbol("cd");
  var FIRESWORD_TARGET_EXCLUDE = [
    "minecraft:item",
    "minecraft:armor_stand",
    "minecraft:xp_orb",
    "minecraft:egg",
    "minecraft:snowball",
    "minecraft:ender_pearl",
    "minecraft:minecart",
    "minecraft:arrow",
    "minecraft:boat",
    "minecraft:chest_boat",
    "minecraft:thrown_trident",
    "minecraft:leash_knot",
    "minecraft:fireball",
    "minecraft:small_fireball",
    "minecraft:evocation_fang",
    "minecraft:tnt",
    "minecraft:wind_charge_projectile"
  ];
  function upgradeFireSword(item) {
    if (isFireSword(item)) {
      item.setLore(["", FIRESOWRD_LORE_DESCRIPTION, `\xA7r\xA76Level: \xA7l${getFireSwordLevel(item) + 1}`]);
      return;
    }
    item.setLore(["", FIRESOWRD_LORE_DESCRIPTION, "\xA7r\xA76Level: \xA7l1"]);
    item.nameTag = FIRESWORD_NAMETAG;
  }
  function isFireSword(item) {
    return item.getLore()[1] == FIRESOWRD_LORE_DESCRIPTION;
  }
  function getFireSwordLevel(swordItem) {
    if (!isFireSword(swordItem))
      return 0;
    return +swordItem.getLore()[2].slice(13);
  }
  function getFireSwordPower(level) {
    return {
      range: 7 + -4 / level,
      damage: 7 + -5 / level,
      cooldown: Math.floor(100 + -70 / level),
      fireLasts: 5.5 + -3 / level
    };
  }
  mc4.world.beforeEvents.itemUse.subscribe((event2) => {
    let player2 = event2.source;
    let level = getFireSwordLevel(event2.itemStack);
    let power = getFireSwordPower(level);
    if (level == 0)
      return;
    if (player2[fireSwordCooldownSymbol] > 0)
      return;
    mc4.system.run(() => {
      let entities = player2.dimension.getEntities({ location: player2.location, maxDistance: power.range });
      for (let entity of entities) {
        if (entity == player2)
          continue;
        if (FIRESWORD_TARGET_EXCLUDE.includes(entity.typeId))
          continue;
        entity.setOnFire(power.fireLasts);
        entity.applyDamage(power.damage, { cause: "fire", damagingEntity: player2 });
      }
      mc4.world.playSound("lt.reaction.fire", player2.location);
      mc4.world.playSound("fire.ignite", player2.location);
      mc4.world.playSound("mob.ghast.fireball", player2.location);
      player2[fireSwordCooldownSymbol] = power.cooldown;
      player2[fireSwordMaxCooldownSymbol] = power.cooldown;
    });
  });
  function showPlayerFireSwordCooldownStatus(player2) {
    if (player2[fireSwordCooldownSymbol] == 0) {
      player2.onScreenDisplay.setActionBar(`\xA7b\xA7lThe \xA7cFire Sword \xA7bis ready`);
      return;
    }
    const length = 30;
    let redCount = Math.floor(player2[fireSwordCooldownSymbol] / player2[fireSwordMaxCooldownSymbol] * length);
    if (redCount < 0)
      redCount = 0;
    if (redCount > length)
      redCount = length;
    let greenCount = length - redCount;
    player2.onScreenDisplay.setActionBar(`\xA7a${"|".repeat(greenCount)}\xA7c${"|".repeat(redCount)}`);
  }
  mc4.system.runInterval(() => {
    let dimensions = /* @__PURE__ */ new Set();
    for (let player2 of mc4.world.getAllPlayers()) {
      dimensions.add(player2.dimension);
      if (player2[fireSwordCooldownSymbol] === void 0) {
        player2[fireSwordCooldownSymbol] = 0;
        player2[fireSwordMaxCooldownSymbol] = 10;
      }
      if (player2[fireSwordCooldownSymbol] > 0)
        --player2[fireSwordCooldownSymbol];
      if (mc4.system.currentTick % 4 == 0) {
        let inventory = player2.getComponent("minecraft:inventory").container;
        let selectedItem = inventory.getItem(player2.selectedSlot);
        if (selectedItem && isFireSword(selectedItem)) {
          showPlayerFireSwordCooldownStatus(player2);
        }
      }
    }
    for (let dimension of dimensions) {
      let netherStarEntities = dimension.getEntities({ type: "minecraft:item" }).filter((entity) => entity.getComponent("minecraft:item").itemStack.typeId == CONVERT_ITEM_ID);
      for (let star of netherStarEntities) {
        let swordEntity = dimension.getEntities({ location: star.location, maxDistance: CONVERT_DISTANCE, type: "minecraft:item" }).filter((entity) => entity.getComponent("minecraft:item").itemStack.hasTag("minecraft:is_sword"))[0];
        if (!swordEntity)
          continue;
        let swordItem = swordEntity.getComponent("minecraft:item").itemStack;
        upgradeFireSword(swordItem);
        dimension.spawnItem(swordItem, swordEntity.location);
        swordEntity.kill();
        let starItem = star.getComponent("minecraft:item").itemStack;
        if (starItem.amount >= 2) {
          --starItem.amount;
          dimension.spawnItem(starItem, star.location);
        }
        star.kill();
      }
    }
  });

  // scripts/Bedwars.js
  var mc5 = __toESM(__require("@minecraft/server"));
  init_utility();
  var GENERATOR_TYPES = defineEnum(["iron_gold", "diamond", "emerald"]);
  var TEAM_TYPES = defineEnum(["red", "green", "yellow", "blue"]);
  var PLAYER_STATE_TYPES = defineEnum(["alive", "respawning", "disconnected", "dead"]);
  var GAME_STATE_TYPES = defineEnum(["pending", "started", "ended"]);
  var log = (s) => mc5.world.sendMessage(String(s));
  function MapInfo() {
    this.teams = {};
    this.generators = [];
  }
  MapInfo.prototype.addTeam = function(team) {
    console.assert(!this.teams[team]);
    this.teams[team] = {
      bed: [],
      shopLocation: []
    };
  };
  MapInfo.prototype.setBed = function(team, location1, location2) {
    console.assert(this.teams[team]);
    this.teams[team].bed = [location1, location2];
  };
  MapInfo.prototype.addGenerator = function(team, genType, location) {
    console.assert(this.teams[team]);
    this.generators.push({ type: genType, location, team });
  };
  MapInfo.prototype.setShop = function(team, location) {
    console.assert(this.teams[team]);
    this.teams[team].shopLocation = location;
  };
  MapInfo.prototype.getTeams = function() {
    return Object.keys(this.teams);
  };
  MapInfo.prototype.getAllGenerators = function() {
    return this.generators;
  };
  function GameSettings() {
  }
  GameSettings.prototype.setMapInfo = function(mapInfo) {
    this.mapInfo = mapInfo;
  };
  GameSettings.prototype.getMapInfo = function(mapInfo) {
    return this.mapInfo;
  };
  function Game() {
    this.teams = {};
    this.players = {};
    this.state = GAME_STATE_TYPES.pending;
  }
  Game.prototype.setSettings = function(settings) {
    this.settings = settings;
  };
  Game.prototype.getSettings = function() {
    return this.settings;
  };
  Game.prototype._addTeam = function(team) {
    this.teams[team] = {
      players: []
    };
  };
  Game.prototype._addPlayer = function(player2) {
  };
  Game.prototype.setPlayer = function(playerName, team) {
    if (!this.teams[team])
      this._addTeam(team);
    for (let iteam of Object.keys(this.teams)) {
      let index = this.teams[iteam].players.indexOf(player);
      if (index >= 0) {
        this.teams[iteam].players.splice(index, 1);
        break;
      }
    }
    this.teams[team].players.push(player);
  };
  Game.prototype.resetAllStatus = function() {
  };
  Game.prototype.removePlayer = function(player2) {
  };
  Game.prototype.getState = function() {
  };
  Game.prototype.start = function() {
  };
  Game.prototype.mainLoop = function() {
  };
  mc5.world.beforeEvents.chatSend.subscribe((event2) => {
    let player2 = event2.sender;
    let message = event2.message;
    if (message == "!start") {
      let game = new Game();
      game.setPlayer(player2, TEAM_TYPES.red);
      log(JSON.stringify(game.teams, null, 2));
      game.setPlayer(player2, TEAM_TYPES.blue);
      log(JSON.stringify(game.teams, null, 2));
    }
  });

  // scripts/main.js
  var import_DebugStick = __toESM(require_DebugStick());

  // scripts/RescuePlatform.js
  var mc6 = __toESM(__require("@minecraft/server"));
  init_utility();
  var PLATFORM_ITEM = function() {
    let item = new mc6.ItemStack("minecraft:blaze_rod", 1);
    item.nameTag = "\xA7r\xA72Rescue Platform";
    item.setLore(["", "\xA7r\xA7eSave you from the void"]);
    return item;
  }();
  var PLATFORM_COOLDOWN = 200;
  var PLATFORM_MAX_AGE = 200;
  var platformCooldownSymbol = Symbol("cooldown");
  var RESCUE_PLATFORM_PERM = mc6.BlockPermutation.resolve("minecraft:slime");
  var AIR_PERM = mc6.BlockPermutation.resolve("minecraft:air");
  var alivePlatforms = [];
  function isItemRescuePlatform(item) {
    return item.getLore()[1] == PLATFORM_ITEM.getLore()[1];
  }
  function addPlatform(location, dimension) {
    let begin = { x: location.x, y: location.y, z: location.z + 1 };
    let end = { x: location.x, y: location.y, z: location.z + 3 };
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });
    begin = { x: location.x + 1, y: location.y, z: location.z };
    end = { x: location.x + 3, y: location.y, z: location.z + 4 };
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });
    begin = { x: location.x + 4, y: location.y, z: location.z + 1 };
    end = { x: location.x + 4, y: location.y, z: location.z + 3 };
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });
  }
  function removePlatform(location, dimension) {
    let begin = { x: location.x, y: location.y, z: location.z + 1 };
    let end = { x: location.x, y: location.y, z: location.z + 3 };
    dimension.fillBlocks(begin, end, AIR_PERM, { matchingBlock: RESCUE_PLATFORM_PERM });
    begin = { x: location.x + 1, y: location.y, z: location.z };
    end = { x: location.x + 3, y: location.y, z: location.z + 4 };
    dimension.fillBlocks(begin, end, AIR_PERM, { matchingBlock: RESCUE_PLATFORM_PERM });
    begin = { x: location.x + 4, y: location.y, z: location.z + 1 };
    end = { x: location.x + 4, y: location.y, z: location.z + 3 };
    dimension.fillBlocks(begin, end, AIR_PERM, { matchingBlock: RESCUE_PLATFORM_PERM });
  }
  mc6.world.beforeEvents.itemUse.subscribe((event2) => {
    if (!isItemRescuePlatform(event2.itemStack))
      return;
    let cooldown = event2.source[platformCooldownSymbol];
    if (cooldown > 0) {
      mc6.system.run(() => {
        event2.source.onScreenDisplay.setActionBar(`\xA72Rescue Platform \xA7cis not available before ${(cooldown / 20).toFixed(1)} seconds.`);
      });
      return;
    }
    let platformLoc = event2.source.location;
    platformLoc.x = Math.floor(platformLoc.x) - 2;
    platformLoc.y = Math.floor(platformLoc.y) - 1;
    platformLoc.z = Math.floor(platformLoc.z) - 2;
    let toLocation = event2.source.location;
    let playerGameMode = getGameMode(event2.source);
    mc6.system.run(() => {
      addPlatform(platformLoc, event2.source.dimension);
      event2.source.teleport(toLocation);
      if (playerGameMode == mc6.GameMode.survival || playerGameMode == mc6.GameMode.adventure) {
        let container = event2.source.getComponent("minecraft:inventory").container;
        if (event2.itemStack.amount > 1) {
          event2.itemStack.amount -= 1;
          container.setItem(event2.source.selectedSlot, event2.itemStack);
        } else {
          container.setItem(event2.source.selectedSlot, null);
        }
      }
    });
    alivePlatforms.push({ location: platformLoc, dimension: event2.source.dimension, timeStamp: mc6.system.currentTick });
    event2.source[platformCooldownSymbol] = PLATFORM_COOLDOWN;
  });
  function isPartOfPlatform(platformLoc, blockLoc) {
    if (!(blockLoc.x >= platformLoc.x && blockLoc.z >= platformLoc.z && blockLoc.y == platformLoc.y && blockLoc.x <= platformLoc.x + 4 && blockLoc.z <= platformLoc.z + 4))
      return false;
    if ((blockLoc.x == platformLoc.x || blockLoc.x == platformLoc.x + 4) && (blockLoc.z == platformLoc.z || blockLoc.z == platformLoc.z + 4))
      return false;
    return true;
  }
  mc6.world.beforeEvents.playerBreakBlock.subscribe((event2) => {
    for (let platform of alivePlatforms) {
      if (event2.dimension != platform.dimension)
        continue;
      if (!isPartOfPlatform(platform.location, event2.block.location))
        continue;
      if (event2.block.permutation == RESCUE_PLATFORM_PERM)
        event2.cancel = true;
    }
  });
  mc6.system.runInterval(() => {
    for (let player2 of mc6.world.getAllPlayers()) {
      if (!player2[platformCooldownSymbol])
        player2[platformCooldownSymbol] = 0;
      if (player2[platformCooldownSymbol] > 0)
        --player2[platformCooldownSymbol];
    }
    let current = mc6.system.currentTick;
    let deadPlatformIndices = [];
    let index = 0;
    for (let platform of alivePlatforms) {
      if (current - platform.timeStamp >= PLATFORM_MAX_AGE) {
        removePlatform(platform.location, platform.dimension);
        deadPlatformIndices.push(index);
      }
      ++index;
    }
    for (let i = deadPlatformIndices.length - 1; i >= 0; --i) {
      alivePlatforms.splice(i, 1);
    }
  });
})();
