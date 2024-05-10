import { random } from "lodash";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { BLOCKS, GAME_STATES, randomPropertyIndex, SOUND } from "./constants";
import { delay } from "./utils";

class MainStore {
  online = false;
  isHost = false;
  myName = localStorage.getItem("myName") || "Player 1";
  roomId = random(1000, 9999).toString();
  channel = null;
  showChat = false;

  chat = {};
  totalPlayers = 2;
  startMoney = 20000;
  gameState = "init";
  playingId = "";
  dice = [6, 6];
  ownedBlocks = {};
  buyingProperty = "";
  sellingProperty = "";
  priceNeedToPay = null;
  endGame = false;
  flightDestination = randomPropertyIndex();
  players = [
    {
      name: "Player 1",
      id: "Player 1",
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
  festivalProperty = [BLOCKS[randomPropertyIndex()].name];

  constructor() {
    makeAutoObservable(this, null, { autoBind: true });
  }

  updateTotalPlayers(total) {
    this.totalPlayers = total;
    if (!this.online) {
      this.players.length = total;
      this.players = this.players.map((player, index) =>
        !player
          ? {
              name: "Player " + (index + 1),
              id: uuidv4(),
              money: this.startMoney,
              position: 1,
            }
          : player
      );
    }
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

  deleteOwnedBlock(name) {
    if (this.ownedBlocks[name]) {
      delete this.ownedBlocks[name];
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
    this.flightDestination = randomPropertyIndex();
    if (this.myName === this.playingId) {
      this.sendDataToChannel(["flightDestination"]);
    }
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
      (this.festivalProperty.includes(block.name) ? 2 : 1);

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
      if (isOwnedAllPropertySameRow)
        return parseInt(
          totalPrice * (allPropertySameRow.length === 2 ? 1.8 : 2)
        );
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

  checkPayToOutJail(playerId) {
    const player = this.players[this.getPlayerIndexById(playerId)];
    return player.payToOutJail;
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

  handleChooseBlock(block, isHide, callback) {
    if (isHide || (this.online && this.playingId !== this.myName)) return;

    if (this.gameState.startsWith(GAME_STATES.NEED_MONEY)) {
      this.sellingProperty = block.name;
      this.sendDataToChannel(["sellingProperty"]);
      return;
    }
    if (this.gameState.startsWith(GAME_STATES.CHOOSE_BUILDING)) {
      if (this.gameState.split("--")[2] === "festival") {
        this.festivalProperty.unshift(block.name);
        this.festivalProperty.length = 2;
        this.sendDataToChannel(["festivalProperty"]);
      }

      if (this.gameState.split("--")[2] === "lostElectricity") {
        this.updateOwnedBlockElectricity(block.name, 1);
        this.sendDataToChannel(["ownedBlocks"]);
      }

      if (this.gameState.split("--")[2] === "downgrade") {
        this.updateOwnedBlockLevel(block.name);
        this.sendDataToChannel(["ownedBlocks"]);
      }

      if (callback) callback();

      return;
    }
  }

  resetSellingState() {
    this.sellingProperty = "";
    this.priceNeedToPay = null;
    this.sendDataToChannel(["sellingProperty", "priceNeedToPay"]);
  }

  setPriceNeedToPay(price) {
    this.priceNeedToPay = price;
  }

  setEndGame(isEnd) {
    this.endGame = isEnd;
    this.gameState = GAME_STATES.END;
  }

  resetGame() {
    if (!this.isHost) return;
    const newData = new Reset();
    Object.keys(newData).forEach((key) => (this[key] = newData[key]));
    this.players = this.players.map((p) => ({
      name: p.name,
      id: p.id,
      money: this.startMoney,
      position: 1,
      broke: false,
    }));
    this.channel.send({
      type: "broadcast",
      event: "updateStore",
      payload: {
        data: {
          ...newData,
          players: this.players,
        },
      },
    });
  }

  setOnline(isOnline) {
    this.online = isOnline;
  }

  setHost(isHost) {
    this.isHost = isHost;
  }

  setMyName(name) {
    localStorage.setItem("myName", name);
    this.myName = name;
    this.players[0].name = name;
    this.players[0].id = name;
  }

  setRoomId(id) {
    this.roomId = id;
  }

  setChannel(channel) {
    this.channel = channel;
  }

  addPlayer(name) {
    this.players.push({
      name: name,
      id: name,
      money: this.startMoney,
      position: 1,
    });
  }

  setPlayers(players) {
    this.players = players;
  }

  updateStore(data) {
    Object.keys(data).forEach((key) => {
      if (key === "chat") {
        Object.keys(data[key]).forEach(
          (name) => {
            const message = data[key][name];
            if (message.startsWith('/mm')) {
              SOUND['meme'+message.split('/mm ')[1]]?.play()
            } else {
              SOUND.chat.play()
            }
            this.chat[name] =
              data[key][name] + "--" + new Date().toISOString()
          }
        );
      } else {
        this[key] = data[key];
      }
    });
  }

  openChat() {
    this.showChat = true;
  }
  closeChat() {
    this.showChat = false;
  }

  addChat(playerId, message) {
    this.chat[playerId] = message;
  }

  sendDataToChannel(keys = []) {
    const data = keys.reduce((fullData, key) => {
      fullData[key] = this[key];
      return fullData;
    }, {});
    this.channel.send({
      type: "broadcast",
      event: "updateStore",
      payload: {
        data,
      },
    });
  }
}

class Reset {
  gameState = GAME_STATES.ROLL_DICE;
  dice = [6, 6];
  ownedBlocks = {};
  buyingProperty = "";
  sellingProperty = "";
  priceNeedToPay = null;
  endGame = false;
  flightDestination = randomPropertyIndex();
  samePlayerRolling = 1;
  festivalProperty = [BLOCKS[randomPropertyIndex()].name];
}

const storeInstance = new MainStore()

export default storeInstance;
