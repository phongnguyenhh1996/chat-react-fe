import { random } from "lodash";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { BLOCKS } from "./constants";
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
  flightDestination = [
    random(2, 7),
    10,
    random(12, 17),
    random(20, 22),
    random(24, 26),
    28,
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

  updateOwnedBlocks(name) {
    if (this.ownedBlocks[name]) {
      this.ownedBlocks[name].level += 1;
    } else {
      this.ownedBlocks[name] = {
        playerId: this.playingId,
        level: 1,
      };
    }
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
      random(12, 17),
      random(20, 22),
      random(24, 26),
      28,
      random(30, 32),
      random(34, 35),
    ][random(0, 7)];
  }

  getPrice(block = {}) {
    if (!["public", "property"].includes(block.type)) return
    const prices = block?.price;
    const level = this.ownedBlocks[block.name]?.level;
    if (!this.ownedBlocks[block.name]) return;
    console.log(this.ownedBlocks[block.name]);

    const rate = [0.2, 1, 2, 3, 4, 1];
    let totalPrice = prices[level - 1] * rate[level - 1];

    if (block.type === "public") {
      const allOwnedPublicBlock = BLOCKS.filter(
        (b) =>
          b.type === "public" &&
          this.ownedBlocks[b.name]?.playerId ===
            this.ownedBlocks[block.name].playerId
      );
      return totalPrice*allOwnedPublicBlock.length
    }

    if (block.type === "property") {
      const allPropertySameRow = BLOCKS.filter(b => b.row === block.row)
      const isOwnedAllPropertySameRow = allPropertySameRow.every(
        (b) =>
          b.row === block.row &&
          this.ownedBlocks[b.name]?.playerId ===
            this.ownedBlocks[block.name].playerId
      );
      if (isOwnedAllPropertySameRow) return totalPrice*2
    }
    console.log(totalPrice);
    return totalPrice
  }
}

export default new MainStore();
