import { random } from "lodash";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { BLOCKS, GAME_STATES } from "./constants";
import { delay } from "./utils";

class MainStore {
  totalPlayers = 2;
  startMoney = 20000;
  gameState = "init";
  playingId = "";
  dice = [6, 6];
  diceManual = [1, 1];
  ownedBlocks = {};
  buyingProperty = "";
  sellingProperty = "";
  priceNeedToPay = null;
  endGame = false;
  flightDestination = [
    random(2, 7),
    10,
    random(12, 14),
    random(16, 17),
    19,
    random(21, 23),
    random(25, 27),
    random(30, 32),
    random(34, 35),
  ][random(0, 7)];
  players = [
    {
      name: "Player 1",
      id: uuidv4(),
      money: 20000,
      position: 1,
    },
    {
      name: "Player 2",
      id: uuidv4(),
      money: 20000,
      position: 1,
    },
  ];
  samePlayerRolling = 1;
  festivalProperty =
    BLOCKS[
      [
        random(2, 7),
        10,
        random(12, 14),
        random(16, 17),
        19,
        random(21, 23),
        random(25, 27),
        random(30, 32),
        random(34, 35),
      ][random(0, 7)]
    ].name;

  constructor() {
    makeAutoObservable(this, null, { autoBind: true });
  }

  updateTotalPlayers(total) {
    this.totalPlayers = total;
    this.players.length = total;
    this.players = this.players.map((player, index) =>
      !player
        ? {
            name: "Player " + (index + 1),
            id: uuidv4(),
            money: 20000,
            position: 1,
          }
        : player
    );
  }

  updateStartMoney(money) {
    this.startMoney = money;
    this.players.forEach((player) => (player.money = money));
  }

  updatePlayerData(data, key, value) {
    data[key] = value;
  }

  updateGameState(state) {
    this.gameState = state;
  }

  async transitionGameState(state1, state2, delayTime) {
    this.gameState = state1;
    await delay(delayTime);
    this.gameState = state2;
  }

  updatePlayingId(id) {
    this.playingId = id;
  }

  randomDice() {
    this.dice = [random(1, 6), random(1, 6)];
  }

  updateBuyingProperty(name) {
    this.buyingProperty = name;
  }

  updateOwnedBlocks(name, price) {
    if (this.ownedBlocks[name]) {
      this.ownedBlocks[name].level += 1;
      this.ownedBlocks[name].price += price;
    } else {
      this.ownedBlocks[name] = {
        playerId: this.playingId,
        level: 1,
        price: price,
      };
    }
  }

  updateOwnedBlockLevel(name) {
    const level = this.ownedBlocks[name]?.level;
    if (level === 1) {
      delete this.ownedBlocks[name];
      if (name === this.sellingProperty) {
        this.sellingProperty = "";
      }
    } else {
      this.ownedBlocks[name].level -= 1;
    }
  }

  updateOwnedBlockElectricity(name, turn) {
    this.ownedBlocks[name].lostElectricity = turn;
  }

  getPlayerIndexById(id) {
    return this.players.findIndex((p) => p.id === id);
  }

  setSamePlayerRolling(number) {
    this.samePlayerRolling = number;
  }

  randomFlightDestination() {
    this.flightDestination = [
      random(2, 7),
      10,
      random(12, 14),
      random(16, 17),
      19,
      random(21, 23),
      random(25, 27),
      random(30, 32),
      random(34, 35),
    ][random(0, 7)];
  }

  getPrice(block = {}, level, isSelling) {
    if (!["public", "property"].includes(block.type)) return;
    const prices = block?.price;
    level = level || this.ownedBlocks[block.name]?.level;
    if (!this.ownedBlocks[block.name]) return;

    const rate = [0.2, 1, 2, 3, 4, 1];
    let totalPrice =
      prices[level - 1] *
      rate[level - 1] *
      (this.festivalProperty === block.name ? 2 : 1);

    if (block.type === "public") {
      const allOwnedPublicBlock = BLOCKS.filter(
        (b) =>
          b.type === "public" &&
          this.ownedBlocks[b.name]?.playerId ===
            this.ownedBlocks[block.name].playerId
      );
      return totalPrice * allOwnedPublicBlock.length;
    }

    if (block.type === "property") {
      const allPropertySameRow = BLOCKS.filter((b) => b.row === block.row);
      const isOwnedAllPropertySameRow = allPropertySameRow.every(
        (b) =>
          b.row === block.row &&
          this.ownedBlocks[b.name]?.playerId ===
            this.ownedBlocks[block.name].playerId
      );
      if (isSelling) return totalPrice;
      if (isOwnedAllPropertySameRow) return totalPrice * 2;
    }
    return totalPrice;
  }

  checkMoney(playerId, price) {
    const player = this.players[this.getPlayerIndexById(playerId)];
    if (player.money >= price) return true;
    if (
      player.money < price &&
      Object.values(this.ownedBlocks).findIndex(
        (b) => b.playerId === player.id
      ) === -1
    )
      return false;
  }

  ensureMoneyIsEnough(checkFunction, playerId, price) {
    return new Promise(function (resolve) {
      (function waitForMoney() {
        const enoughMoney = checkFunction(playerId, price);
        if (enoughMoney) return resolve(true);
        if (enoughMoney === false) return resolve(false);
        setTimeout(waitForMoney, 30);
      })();
    });
  }

  handleChooseBlock(block, callback) {
    if (
      this.gameState.startsWith(GAME_STATES.NEED_MONEY) &&
      this.gameState.split("--")[2] === this.ownedBlocks[block.name]?.playerId
    ) {
      this.sellingProperty = block.name;
      return;
    }
    console.log(this.ownedBlocks[block.name]?.playerId, this.playingId);
    if (
      this.gameState === GAME_STATES.CHOOSE_FESTIVAL_BUILDING &&
      this.ownedBlocks[block.name]?.playerId === this.playingId
    ) {
      this.festivalProperty = block.name;
      if (callback) callback()
      return;
    }
  }

  resetSellingState() {
    this.sellingProperty = "";
    this.priceNeedToPay = null;
  }

  setPriceNeedToPay(price) {
    this.priceNeedToPay = price;
  }

  setEndGame(isEnd) {
    this.endGame = isEnd;
  }

  resetGame() {
    this.totalPlayers = 2;
    this.startMoney = 20000;
    this.gameState = "init";
    this.playingId = "";
    this.dice = [6, 6];
    this.diceManual = [1, 1];
    this.ownedBlocks = {};
    this.buyingProperty = "";
    this.sellingProperty = "";
    this.priceNeedToPay = null;
    this.endGame = false;
    this.flightDestination = [
      random(2, 7),
      10,
      random(12, 14),
      random(16, 17),
      19,
      random(21, 23),
      random(25, 27),
      random(30, 32),
      random(34, 35),
    ][random(0, 7)];
    this.players = [
      {
        name: "Player 1",
        id: uuidv4(),
        money: 20000,
        position: 1,
      },
      {
        name: "Player 2",
        id: uuidv4(),
        money: 20000,
        position: 1,
      },
    ];
    this.samePlayerRolling = 1;
    this.festivalProperty =
      BLOCKS[
        [
          random(2, 7),
          10,
          random(12, 14),
          random(16, 17),
          19,
          random(21, 23),
          random(25, 27),
          random(30, 32),
          random(34, 35),
        ][random(0, 7)]
      ].name;
  }
}

export default new MainStore();
