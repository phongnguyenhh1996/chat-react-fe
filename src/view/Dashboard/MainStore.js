import { Button } from "antd";
import { random, range, get, orderBy, pick } from "lodash";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import {
  BEG_MONEY,
  BLOCKS,
  COLORS,
  GAME_STATES,
  randomPropertyIndex,
  REBUY_RATE,
  SELL_RATE,
  SOUND,
} from "./constants";
import { delay } from "./utils";
import packageJson from "../../../package.json";

export const SYNC_KEY = [
  "roomId",
  "totalPlayers",
  "startMoney",
  "gameState",
  "playingId",
  "dice",
  "ownedBlocks",
  "buyingProperty",
  "sellingProperty",
  "priceNeedToPay",
  "endGame",
  "flightDestination",
  "players",
  "samePlayerRolling",
  "festivalProperty",
  "cameraKey",
  "loans",
  "hostName",
];

class MainStore {
  online = true;
  host = false;
  myName = localStorage.getItem("myName") || "Player 1";
  roomId = random(1000, 9999).toString();
  channel = null;
  waitingRoomChannel = null;
  showChat = false;
  cameraRef = null;
  messageApi = null;
  roomList = [];
  sync = false;

  hostName = "";
  loans = {};
  chat = {};
  totalPlayers = 4;
  startMoney = 20000;
  gameState = "init";
  playingId = "";
  dice = [6, 6];
  ownedBlocks = {};
  buyingProperty = "";
  sellingProperty = "";
  targetedProperty = "";
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
  cameraKey = "reset";

  constructor() {
    makeAutoObservable(this, null, { autoBind: true });
  }

  *rollDice() {
    if (
      this.gameState !== GAME_STATES.ROLL_DICE ||
      (this.online && this.playingId !== this.myName)
    )
      return;
    this.updateGameState(GAME_STATES.ROLLING_DICE);
    this.randomDice();
    this.sendDataToChannel(["dice"]);
    yield delay(200);
    this.randomDice();
    this.sendDataToChannel(["dice"]);
    yield delay(500);
    this.movingPlayer();
    // this.movingPlayer(() => {}, random(5, 6));
  }

  *movingPlayer(callback, planeDestinationPostion) {
    if (this.currentPlayer.onJail > 0) {
      if (this.dice[0] === this.dice[1]) {
        this.updateGameState(GAME_STATES.GOING_OUT_JAIL);
        this.updatePlayerData(this.currentPlayer, "onJail", 0);
        this.sendDataToChannel(["players", "gameState"]);
        yield delay(2000);
        this.nextPlayerTurn(true);
      } else {
        this.updatePlayerData(
          this.currentPlayer,
          "onJail",
          this.currentPlayer.onJail + 1
        );
        this.sendDataToChannel(["players", "gameState"]);
        yield delay(500);
        if (this.currentPlayer.onJail === 4) {
          let price = 500;
          if (this.currentPlayer.money - 500 < 0) {
            price = yield this.handleNotEnoughMoney(this.currentPlayer, price);
          }
          this.updatePlayerData(
            this.currentPlayer,
            "money",
            this.currentPlayer.money - price
          );
          this.updatePlayerData(this.currentPlayer, "onJail", 0);
          this.updateGameState(
            GAME_STATES.DEC_MONEY + `--${price}--bank--pay-out-jail`
          );
          this.sendDataToChannel(["gameState"]);
          this.sendMoneyToChannel(this.currentPlayer.id, price, false);
          yield delay(2000);
          this.nextPlayerTurn(true);
          return;
        }
        this.updateGameState(GAME_STATES.ASK_TO_PAY_TO_OUT_JAIL);
        this.sendDataToChannel(["gameState"]);
        const playerPayToOutJail = yield this.ensureMoneyIsEnough(
          this.checkPayToOutJail,
          this.currentPlayer.id
        );
        if (playerPayToOutJail) {
          this.updatePlayerData(this.currentPlayer, "onJail", 3);
          this.updatePlayerData(this.currentPlayer, "payToOutJail", undefined);
          this.sendDataToChannel(["players"]);
          this.movingPlayer();
          return;
        }
        this.updatePlayerData(this.currentPlayer, "payToOutJail", undefined);
        this.sendDataToChannel(["players"]);
        this.nextPlayerTurn(true);
      }
      return;
    }
    const newPosition = planeDestinationPostion
      ? planeDestinationPostion
      : this.currentPlayer.position + this.dice[0] + this.dice[1];

    if (!planeDestinationPostion) {
      this.updateGameState(GAME_STATES.MOVING);
      yield delay(500);
    }
    const moving = setInterval(
      () => {
        if (this.currentPlayer.position === newPosition) {
          clearInterval(moving);
          this.checkNewRound();
          if (callback) {
            callback();
          }
        } else {
          this.updatePlayerData(
            this.currentPlayer,
            "position",
            this.currentPlayer.position +
              (newPosition > this.currentPlayer.position ? 1 : -1)
          );
          this.sendDataToChannel(["players", "gameState"]);
        }
      },
      planeDestinationPostion ? 100 : 200
    );
  }

  *nextPlayerTurn(forceSwitch) {
    this.updateGameState(GAME_STATES.SWITCH_TURN);
    this.sendDataToChannel(["gameState"]);
    yield delay(100);
    if (forceSwitch || this.currentPlayer.broke) {
      this.goNextAvailablePlayer();
      return;
    }
    if (this.dice[0] === this.dice[1]) {
      this.setSamePlayerRolling(this.samePlayerRolling + 1);
      if (this.samePlayerRolling > 3) {
        this.goToJail();
      } else {
        this.updateGameState(GAME_STATES.ROLL_DICE);
      }
      this.sendDataToChannel(["gameState", "samePlayerRolling"]);
    } else {
      this.goNextAvailablePlayer();
    }
  }

  get currentPlayer() {
    return this.players.find((p) => p.id === this.playingId);
  }

  *handleNotEnoughMoney(player, price) {
    this.updateGameState(GAME_STATES.NEED_MONEY + "----" + player.id);
    this.setPriceNeedToPay(price);
    this.sendDataToChannel(["priceNeedToPay", "gameState"]);
    const playerStillHaveMoney = yield this.ensureMoneyIsEnough(
      this.checkMoney,
      player.id,
      price
    );
    if (!playerStillHaveMoney) {
      price = player.money;
      this.updatePlayerData(player, "broke", true);
      this.updatePlayerData(player, "position", 1);
      Object.keys(this.ownedBlocks).forEach((key) => {
        if (this.ownedBlocks[key].playerId === player.id) {
          this.deleteOwnedBlock(key);
        }
      });
      this.sendDataToChannel(["players", "ownedBlocks"]);
      this.checkEndGame();
    }
    yield delay(1000);
    this.resetSellingState();
    return price;
  }

  goNextAvailablePlayer() {
    this.setSamePlayerRolling(1);
    let nextPlayerIndex = this.getPlayerIndexById(this.playingId) + 1;
    if (nextPlayerIndex >= this.players.length) {
      nextPlayerIndex = 0;
    }
    while (
      this.players[nextPlayerIndex] &&
      this.players[nextPlayerIndex].broke
    ) {
      nextPlayerIndex += 1;
      if (nextPlayerIndex >= this.players.length) {
        nextPlayerIndex = 0;
      }
    }
    this.updatePlayingId(this.players[nextPlayerIndex].id);
    this.updateGameState(GAME_STATES.ROLL_DICE);
    this.sendDataToChannel(["playingId", "samePlayerRolling", "gameState"]);
  }

  *checkNewRound() {
    const round = this.currentPlayer.round || 0;
    const currentRound = Math.floor(
      (this.currentPlayer.position - 1) / BLOCKS.length
    );
    if (currentRound > round) {
      this.updatePlayerData(
        this.currentPlayer,
        "money",
        this.currentPlayer.money + 2000
      );
      this.updatePlayerData(this.currentPlayer, "round", currentRound);
      this.updateGameState(GAME_STATES.INC_MONEY + "--2000--bank--new-round");
      this.sendDataToChannel(["gameState", "players"]);
      yield delay(2000);
      this.checkCurrentBlock();
    } else this.checkCurrentBlock();
  }

  *checkCurrentBlock() {
    let idx = this.currentPlayer.position - 1;
    if (idx > BLOCKS.length - 1) {
      idx = idx % BLOCKS.length;
    }
    const block = BLOCKS[idx] || {};
    if (block.type === "property" || block.type === "public") {
      const ownedBlock = this.ownedBlocks[block.name];
      if (!ownedBlock) {
        this.updateBuyingProperty(block.name);
        this.sendDataToChannel(["buyingProperty"]);
        yield delay(1000);
        this.updateGameState(GAME_STATES.BUYING);
        this.sendDataToChannel(["gameState"]);
      } else {
        if (ownedBlock.playerId !== this.currentPlayer.id) {
          const receivePlayer =
            this.players[this.getPlayerIndexById(ownedBlock.playerId)];
          if (!receivePlayer.onJail) {
            if (ownedBlock.lostElectricity > 0) {
              this.updateGameState(GAME_STATES.CURRENT_LOST_ELECTRIC);
              this.updateOwnedBlockElectricity(block.name);
              this.sendDataToChannel(["gameState", "ownedBlocks"]);
            } else {
              let price = this.getPrice(block);
              if (this.currentPlayer.money - price < 0) {
                price = yield this.handleNotEnoughMoney(
                  this.currentPlayer,
                  price
                );
              }
              this.updatePlayerData(
                this.currentPlayer,
                "money",
                this.currentPlayer.money - price
              );

              this.updatePlayerData(
                receivePlayer,
                "money",
                receivePlayer.money + price
              );

              this.updateGameState(
                GAME_STATES.DEC_MONEY + "--" + price + "--" + receivePlayer.id
              );
              this.sendDataToChannel(["gameState"]);
              this.sendMoneyToChannel(this.currentPlayer.id, price, false);
              this.sendMoneyToChannel(receivePlayer.id, price, true);
              if (
                block.type === "property" &&
                !this.currentPlayer.broke &&
                ownedBlock.level <= 5
              ) {
                yield delay(2000);
                this.updateBuyingProperty(block.name);
                this.updateGameState(GAME_STATES.REBUYING);
                this.sendDataToChannel(["gameState", "buyingProperty"]);
                return;
              }
            }
          } else {
            this.updateGameState(GAME_STATES.RECEIVER_ON_JAIL);
            this.sendDataToChannel(["gameState"]);
          }
          yield delay(2000);
          this.nextPlayerTurn();
        } else {
          if (block.type === "public") {
            yield delay(2000);
            this.nextPlayerTurn();
            return;
          }
          if (ownedBlock?.level === 6) {
            this.updateGameState(GAME_STATES.MAX_LEVEL_PROPERTY);
            this.sendDataToChannel(["gameState"]);
            yield delay(2000);
            this.nextPlayerTurn();
          } else {
            this.updateBuyingProperty(block.name);
            this.sendDataToChannel(["buyingProperty"]);
            yield delay(1000);
            this.updateGameState(GAME_STATES.UPDATING);
            this.sendDataToChannel(["gameState"]);
          }
        }
      }
      return;
    }

    if (block.type === "jail") {
      this.goToJail();
      return;
    }

    if (block.type === "jail-visit") {
      const totalPlayerOnJail = this.players.filter((p) => p.onJail > 0).length;
      if (totalPlayerOnJail > 0) {
        let price = totalPlayerOnJail * 200;
        if (this.currentPlayer.money - price < 0) {
          price = yield this.handleNotEnoughMoney(this.currentPlayer, price);
        }
        this.updatePlayerData(
          this.currentPlayer,
          "money",
          this.currentPlayer.money - price
        );
        this.updateGameState(
          GAME_STATES.DEC_MONEY + "--" + price + "--bank--jail-visit"
        );
        this.sendDataToChannel(["gameState"]);
        this.sendMoneyToChannel(this.currentPlayer.id, price, false);
        yield delay(2000);
      }
      this.nextPlayerTurn();
      return;
    }

    if (block.type === "chance") {
      let chances = [
        this.receiveGift,
        this.randomTravel,
        this.chooseLostElectric,
        this.chooseDowngrade,
        this.payTax,
        this.goToJail,
        this.movingBack,
        this.randomDowngrade,
        this.randomLostElectric,
        this.chooseTravel,
      ];

      if (!this.currentPlayer.haveFreeCard) {
        chances.push(this.giveFreeCard);
      }

      const allMyBuilding = Object.keys(this.ownedBlocks).filter(
        (key) => this.ownedBlocks[key].playerId === this.currentPlayer.id
      );

      if (allMyBuilding.length > 0) {
        chances.push(() => {
          this.updateGameState(
            GAME_STATES.CHOOSE_BUILDING + "--my-building--festival"
          );
          this.sendDataToChannel(["gameState"]);
        });
        chances.push(() => {
          this.updateGameState(
            GAME_STATES.CHOOSE_BUILDING + "--my-building--protect"
          );
          this.sendDataToChannel(["gameState"]);
        });
      }

      const allMyBuildingLowerThan5 = Object.keys(this.ownedBlocks).filter(
        (key) =>
          this.ownedBlocks[key].playerId === this.currentPlayer.id &&
          this.ownedBlocks[key].level < 5 &&
          BLOCKS.find((b) => b.name === key).type !== "public"
      );

      if (allMyBuildingLowerThan5.length > 0) {
        chances.push(() => {
          this.updateGameState(
            GAME_STATES.CHOOSE_BUILDING + "--my-building-lower-5--upgradeFree"
          );
          this.sendDataToChannel(["gameState"]);
        });
      }

      const allMyBuildingLostElectricity = Object.keys(this.ownedBlocks).filter(
        (key) =>
          this.ownedBlocks[key].playerId === this.currentPlayer.id &&
          this.ownedBlocks[key].lostElectricity > 0
      );

      if (allMyBuildingLostElectricity.length > 0) {
        chances.push(() => {
          this.updateGameState(
            GAME_STATES.CHOOSE_BUILDING + "--my-building--fixElectricity"
          );
          this.sendDataToChannel(["gameState"]);
        });
      }

      const randomNumber = random(0, chances.length - 1);
      const randomChanceAction = chances[randomNumber];
      randomChanceAction();
      return;
    }

    if (block.type === "plane") {
      this.flight(this.flightDestination, this.randomFlightDestination);
      return;
    }

    this.nextPlayerTurn();
  }

  flight(destinationIndex, callback) {
    const noFunction = () => {};
    const round = Math.floor((this.currentPlayer.position - 1) / BLOCKS.length);
    const currentRoundDestination =
      round * BLOCKS.length + (destinationIndex + 1);
    let position = currentRoundDestination;
    if (position <= this.currentPlayer.position) {
      position += BLOCKS.length;
    }

    this.updateGameState(GAME_STATES.FLIGHT + "--" + destinationIndex);
    this.sendDataToChannel(["gameState"]);
    delay(2000).then(() => this.movingPlayer(callback || noFunction, position));
  }

  chooseTravel() {
    this.updateGameState(
      GAME_STATES.CHOOSE_BUILDING + "--all-building--travel"
    );
    this.sendDataToChannel(["gameState"]);
  }

  *receiveGift() {
    const gift = [500, 1000][random(0, 1)];
    this.updatePlayerData(
      this.currentPlayer,
      "money",
      this.currentPlayer.money + gift
    );
    this.updateGameState(GAME_STATES.INC_MONEY + "--" + gift + "--bank--gift");
    this.sendDataToChannel(["gameState"]);
    this.sendMoneyToChannel(this.currentPlayer.id, gift, true);
    yield delay(2000);
    this.nextPlayerTurn();
  }

  *randomTravel() {
    const allOwnedBlockKeys = Object.keys(this.ownedBlocks).filter(
      (key) => this.ownedBlocks[key].playerId === this.currentPlayer.id
    );
    this.updateGameState(GAME_STATES.RANDOM_TRAVELING);
    this.sendDataToChannel(["gameState"]);
    yield delay(2000);
    if (allOwnedBlockKeys.length > 0) {
      const randomKey =
        allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
      const idx = BLOCKS.findIndex((b) => b.name === randomKey);
      const round = Math.floor(
        (this.currentPlayer.position - 1) / BLOCKS.length
      );
      const currentRoundDestination = round * BLOCKS.length + (idx + 1);
      let position = currentRoundDestination;
      if (position <= this.currentPlayer.position) {
        position += BLOCKS.length;
      }
      this.movingPlayer(() => {}, position);
    } else {
      this.updatePlayerData(
        this.currentPlayer,
        "money",
        this.currentPlayer.money + 500
      );
      this.updateGameState(GAME_STATES.INC_MONEY + "--" + 500 + "--bank");
      this.sendDataToChannel(["gameState", "players"]);
      yield delay(2000);
      this.nextPlayerTurn();
    }
    return;
  }
  *chooseLostElectric() {
    const allOtherOwnedBlockKeys = Object.keys(this.ownedBlocks).filter(
      (key) => this.ownedBlocks[key].playerId !== this.currentPlayer.id
    );
    if (allOtherOwnedBlockKeys.length > 0) {
      this.updateGameState(
        GAME_STATES.CHOOSE_BUILDING + "--other-building--lostElectricity"
      );
      this.sendDataToChannel(["gameState"]);
    } else {
      this.updateGameState(
        GAME_STATES.NO_BLOCK_TO_CHOOSE + "--lostElectricity"
      );
      this.sendDataToChannel(["gameState"]);
      yield delay(2000);
      this.nextPlayerTurn();
      return;
    }
  }

  *chooseDowngrade() {
    const allOtherOwnedBlockKeys = Object.keys(this.ownedBlocks).filter(
      (key) => this.ownedBlocks[key].playerId !== this.currentPlayer.id
    );
    if (allOtherOwnedBlockKeys.length > 0) {
      this.updateGameState(
        GAME_STATES.CHOOSE_BUILDING + "--other-building--downgrade"
      );
      this.sendDataToChannel(["gameState"]);
    } else {
      this.updateGameState(GAME_STATES.NO_BLOCK_TO_CHOOSE + "--downgrade");
      this.sendDataToChannel(["gameState"]);
      yield delay(2000);
      this.nextPlayerTurn();
      return;
    }
  }

  *payTax() {
    let tax = parseInt(this.currentPlayer.money * 0.15);
    if (tax < 500) {
      tax = 500;
    }
    if (this.currentPlayer.money - tax < 0) {
      tax = yield this.handleNotEnoughMoney(this.currentPlayer, tax);
    }
    this.updatePlayerData(
      this.currentPlayer,
      "money",
      this.currentPlayer.money - tax
    );
    this.updateGameState(GAME_STATES.DEC_MONEY + "--" + tax + "--bank--tax");
    this.sendDataToChannel(["gameState"]);
    this.sendMoneyToChannel(this.currentPlayer.id, tax, false);
    yield delay(2000);
    this.nextPlayerTurn();
  }
  getJailPosition(player) {
    return Math.floor(player.position / BLOCKS.length) * BLOCKS.length + 10;
  }
  *goToJail() {
    this.updateGameState(GAME_STATES.GOING_JAIL);
    this.sendDataToChannel(["gameState"]);
    yield delay(2000);
    if (this.currentPlayer.haveFreeCard) {
      this.updateGameState(GAME_STATES.USE_FREE_CARD);
      this.updatePlayerData(this.currentPlayer, "haveFreeCard", false);
      this.sendDataToChannel(["players", "gameState"]);
      yield delay(2000);
      this.nextPlayerTurn(true);
      return;
    }
    this.updatePlayerData(
      this.currentPlayer,
      "position",
      this.getJailPosition(this.currentPlayer)
    );
    this.updatePlayerData(this.currentPlayer, "onJail", 1);
    this.sendDataToChannel(["players"]);
    this.nextPlayerTurn(true);
  }

  *movingBack() {
    const round = this.currentPlayer.round || 0;
    const position = random(
      this.currentPlayer.position - 1,
      round * BLOCKS.length + 1
    );
    this.updateGameState(
      GAME_STATES.GOING_BACK + "--" + (this.currentPlayer.position - position)
    );
    this.sendDataToChannel(["gameState"]);
    yield delay(2000);
    this.movingPlayer(() => {}, position);
  }
  *randomDowngrade() {
    const allOwnedBlockKeys = Object.keys(this.ownedBlocks).filter(
      (key) =>
        this.ownedBlocks[key].playerId === this.currentPlayer.id &&
        !this.ownedBlocks[key].protected
    );
    if (allOwnedBlockKeys.length === 0) {
      this.updateGameState(GAME_STATES.DOWN_GRADE_BUILDING + "--no-property");
      this.sendDataToChannel(["gameState"]);
      yield delay(2000);
      this.nextPlayerTurn();
      return;
    }
    const randomKey =
      allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
    this.updateGameState(GAME_STATES.DOWN_GRADE_BUILDING + "--" + randomKey);
    this.sendDataToChannel(["gameState"]);
    yield delay(2000);
    const price = this.getSellingPrice(randomKey);
    this.updatePlayerData(
      this.currentPlayer,
      "money",
      parseInt(this.currentPlayer.money + price)
    );
    this.updateOwnedBlockLevel(randomKey);
    this.updateGameState(GAME_STATES.INC_MONEY + "--" + price + "--bank");
    this.sendDataToChannel([
      "gameState",
      "players",
      "sellingProperty",
      "ownedBlocks",
    ]);
    yield delay(2000);
    this.nextPlayerTurn();
  }

  *randomLostElectric() {
    const allOwnedBlockKeys = Object.keys(this.ownedBlocks).filter(
      (key) =>
        this.ownedBlocks[key].playerId === this.currentPlayer.id &&
        !this.ownedBlocks[key].protected
    );
    this.updateGameState(GAME_STATES.LOST_ELECTRIC_BUILDING);
    this.sendDataToChannel(["gameState"]);
    yield delay(2000);
    if (allOwnedBlockKeys.length > 0) {
      const randomKey =
        allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
      this.updateOwnedBlockElectricity(randomKey, 1);
      this.updateGameState(
        GAME_STATES.LOST_ELECTRIC_BUILDING + "--" + randomKey
      );
      this.sendDataToChannel(["ownedBlocks"]);
      yield delay(1000);
    }
    this.nextPlayerTurn();
    return;
  }

  *giveFreeCard() {
    this.updateGameState(GAME_STATES.FREE_OUT_FAIL_CARD);
    this.sendDataToChannel(["gameState"]);
    yield delay(2000);
    this.updatePlayerData(this.currentPlayer, "haveFreeCard", true);
    this.sendDataToChannel(["players"]);
    this.nextPlayerTurn();
    return;
  }

  checkEndGame(needCheck, player) {
    let state;
    if (this.players.filter((p) => !p.broke).length < 2) {
      const playerNotBroke = this.players.find((p) => !p.broke);
      this.updatePlayerData(playerNotBroke, "winner", true);
      this.updatePlayerData(playerNotBroke, "winReason", "not-broke");
      this.setEndGame(true);
      this.sendDataToChannel(["players", "endGame"]);
      return;
    }

    let isFourPublic = false;
    let isThreeMonopoly = false;
    this.players.forEach((p) => {
      const ownedBlocks = Object.keys(this.ownedBlocks).filter(
        (key) => this.ownedBlocks[key].playerId === p.id
      );
      let rows = {};
      ownedBlocks.forEach((key) => {
        const block = BLOCKS.find((b) => b.name === key);
        const rowKey = block.row || block.type;
        if (rows[rowKey]) {
          rows[rowKey].push(block.name);
        } else {
          rows[rowKey] = [block.name];
        }
      });
      isFourPublic = rows["public"]?.length === 4;
      isThreeMonopoly =
        Object.keys(rows).filter(
          (key) =>
            rows[key].length === BLOCKS.filter((b) => b.row === key).length &&
            key !== "public"
        ).length === 3;
      if (isFourPublic || isThreeMonopoly) {
        this.updatePlayerData(p, "winner", true);
        this.updatePlayerData(
          p,
          "winReason",
          isFourPublic ? "four-public" : "three-monopoly"
        );
        this.setEndGame(true);
        this.sendDataToChannel(["players", "endGame"]);
        return;
      }
      if (!needCheck || p.id !== player.id) return;
      console.log(player.almostWin);
      if (
        rows.public?.length === 3 &&
        (player.almostWin || "").split("--")[1] !== "four-public"
      ) {
        state =
          GAME_STATES.ALMOST_END + "--four-public--" + p.id + '--["public"]';
        return state;
      }
      const allmostWinRows = Object.keys(rows).filter(
        (key) =>
          rows[key].length === BLOCKS.filter((b) => b.row === key).length &&
          key !== "public"
      );
      const blockOrderByRow = BLOCKS.reduce((prev, current) => {
        if (prev[current.row]) {
          prev[current.row].push(current);
        } else {
          prev[current.row] = [current];
        }
        return prev;
      }, {});
      const rowAlmostDone = Object.keys(blockOrderByRow).find(
        (key) =>
          rows[key] && blockOrderByRow[key].length === rows[key].length + 1
      );
      if (
        allmostWinRows.length === 2 &&
        rowAlmostDone &&
        (player.almostWin || "").split("--")[1] !== "three-monopoly"
      ) {
        state =
          GAME_STATES.ALMOST_END +
          "--three-monopoly--" +
          p.id +
          "--" +
          JSON.stringify([...allmostWinRows, rowAlmostDone]);
        return state;
      }
    });

    return state;
  }

  *buyProperty(player, gameState) {
    const isRebuy = gameState === GAME_STATES.REBUYING;
    const updatingPropertyInfo =
      this.ownedBlocks[this.buyingPropertyInfo.name] || {};
    const currentPlayer = player;
    let price = this.buyingPropertyInfo.price[updatingPropertyInfo?.level || 0];
    let receivePlayer;
    if (isRebuy) {
      price = this.getRebuyPrice(this.buyingPropertyInfo);
    }
    const priceBefore = price;
    let priceAfter = price;
    if (currentPlayer.money - price < 0) {
      priceAfter = yield this.handleNotEnoughMoney(currentPlayer, price);
    }
    if (priceBefore === priceAfter) {
      this.updatePlayerData(
        currentPlayer,
        "money",
        currentPlayer.money - price
      );
      this.sendMoneyToChannel(this.currentPlayer.id, price, false);
      if (isRebuy) {
        receivePlayer =
          this.players[this.getPlayerIndexById(updatingPropertyInfo.playerId)];
        this.updateOwnedBlockPlayerId(
          this.buyingPropertyInfo.name,
          currentPlayer.id
        );
        this.updatePlayerData(
          receivePlayer,
          "money",
          receivePlayer.money + price
        );
        this.sendMoneyToChannel(receivePlayer.id, price, true);
      } else {
        this.updateOwnedBlocks(this.buyingPropertyInfo.name, price);
      }
      this.updateGameState(
        GAME_STATES.DEC_MONEY +
          "--" +
          price +
          "--" +
          (isRebuy ? receivePlayer.id : "bank")
      );
      this.sendDataToChannel(["ownedBlocks", "gameState"]);
    }

    yield delay(2000);
    const state = this.checkEndGame(gameState !== GAME_STATES.UPDATING, player);
    if (
      state &&
      state !== player.almostWin &&
      state.includes(
        this.buyingPropertyInfo?.row || this.buyingPropertyInfo?.type
      )
    ) {
      this.updateGameState(state);
      this.sendDataToChannel(["gameState"]);
      yield delay(6000);
    }
    this.updatePlayerData(player, "almostWin", state || player.almostWin);
    if (
      (this.ownedBlocks[this.buyingProperty]?.level < 2 || isRebuy) &&
      this.buyingPropertyInfo?.type === "property" &&
      !currentPlayer.broke
    ) {
      this.updateGameState(GAME_STATES.UPDATING);
      this.sendDataToChannel(["gameState"]);
    } else {
      this.nextPlayerTurn();
    }
  }

  getSellingPrice(key, level) {
    const currentSellingProperty = key
      ? BLOCKS.find((block) => block.name === key)
      : this.sellingPropertyBlock;
    const currentSellingPropertyInfor = key
      ? this.ownedBlocks[key]
      : this.sellingPropertyInfor;
    level = level !== undefined ? level : currentSellingPropertyInfor?.level;
    if (currentSellingProperty.type === "public")
      return currentSellingProperty.price[0];
    const price = currentSellingProperty.price[level - 1];
    return parseInt(price / SELL_RATE);
  }

  *sellProperty() {
    const price = this.getSellingPrice();
    this.updatePlayerData(
      this.currentPlayer,
      "money",
      parseInt(this.currentPlayer.money + price)
    );
    this.sendMoneyToChannel(this.currentPlayer.id, price, true);
    this.updateOwnedBlockLevel(this.sellingProperty);
    this.updateGameState(
      GAME_STATES.NEED_MONEY + "_inc--" + price + "--" + this.currentPlayer.id
    );
    this.sendDataToChannel([
      "gameState",
      "ownedBlocks",
      "sellingProperty",
    ]);
    yield delay(1000);
  }

  updatePayToOutJail(payToOutJail) {
    this.updatePlayerData(this.currentPlayer, "payToOutJail", payToOutJail);
    this.updateGameState(GAME_STATES.RESPONDED_PAY_OUT_JAIL);
    this.sendDataToChannel(["gameState", "players"]);
  }

  get buyingPropertyInfo() {
    return BLOCKS.find((block) => block.name === this.buyingProperty);
  }

  get sellingPropertyBlock() {
    return BLOCKS.find((block) => block.name === this.sellingProperty);
  }
  get sellingPropertyInfor() {
    return this.ownedBlocks[this.sellingProperty];
  }

  surrender() {
    const player = this.players[this.getPlayerIndexById(this.myName)];
    this.updatePlayerData(player, "broke", true);
    this.updatePlayerData(player, "position", 1);
    Object.keys(this.ownedBlocks).forEach((key) => {
      if (this.ownedBlocks[key].playerId === player.id) {
        this.deleteOwnedBlock(key);
      }
    });
    this.sendDataToChannel(["ownedBlocks", "players"]);
    this.checkEndGame();
    if (this.gameState !== GAME_STATES.END) {
      this.nextPlayerTurn(true);
    }
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
    if (key === "almostWin") console.log(value);
    data[key] = value;
  }

  updateGameState(state) {
    this.gameState = state;
  }

  updatePlayingId(id) {
    this.playingId = id;
  }

  randomDice() {
    if (
      this.currentPlayer.position <= BLOCKS.length * 2 + 1 &&
      this.currentPlayer.id === this.myName
    ) {
      let luckyDices = [];
      for (let x = 1; x <= 6; x++) {
        for (let y = 1; y <= 6; y++) {
          let idx = this.currentPlayer.position + x + y - 1;
          if (idx > BLOCKS.length - 1) {
            idx = idx % BLOCKS.length;
          }
          const block = BLOCKS[idx] || {};
          if (
            !this.ownedBlocks[block.name] &&
            ["property"].includes(block.type)
          ) {
            luckyDices.push([x, y]);
          }
        }
      }
      let randomDice = [[random(1, 6), random(1, 6)]];
      if (luckyDices.length > 0) {
        randomDice.push(luckyDices[random(0, luckyDices.length - 1)]);
      }
      this.dice = randomDice[random(0, randomDice.length - 1)];
    } else {
      this.dice = [random(1, 6), random(1, 6)];
    }
  }

  get lowestStatisticPlayerId() {
    const statistic = this.getTotalMoneyPlayers();
    if (
      this.players.length > 2 &&
      statistic[0].total - statistic[statistic.length - 1].total > 12000
    )
      return statistic[statistic.length - 1].id;

    return null;
  }

  get isLowestStatistic() {
    return (
      this.lowestStatisticPlayerId === this.myName &&
      this.playingId === this.myName
    );
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

  updateOwnedBlockPlayerId(name, playerId) {
    this.ownedBlocks[name].playerId = playerId;
  }

  updateOwnedBlockElectricity(name, turn) {
    this.ownedBlocks[name].lostElectricity = turn;
  }

  updateOwnedBlockProtected(name, isProtected) {
    this.ownedBlocks[name].protected = isProtected;
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

  isMonopolyBlock(block) {
    const allPropertySameRow = BLOCKS.filter((b) => b.row === block.row);
    const isOwnedAllPropertySameRow = allPropertySameRow.every(
      (b) =>
        b.row === block.row &&
        this.ownedBlocks[block.name] &&
        this.ownedBlocks[b.name]?.playerId ===
          this.ownedBlocks[block.name].playerId
    );

    return {
      value: isOwnedAllPropertySameRow,
      length: allPropertySameRow.length,
    };
  }

  getPrice(block = {}, level, isSelling) {
    if (!["public", "property"].includes(block.type)) return;
    const prices = block?.price;
    level = level >= 0 ? level : this.ownedBlocks[block.name]?.level;
    if (!this.ownedBlocks[block.name] && !isSelling) return;

    const rate = [0.2, 1, 2, 3, 3.5, 2.5];
    let totalPrice = parseInt(
      prices[level - 1] *
        rate[level - 1] *
        (this.festivalProperty.includes(block.name) ? 2 : 1)
    );

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
      if (this.isMonopolyBlock(block).value)
        return parseInt(
          totalPrice * (this.isMonopolyBlock(block).length === 2 ? 1.8 : 2)
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
    return new Promise((resolve) => {
      const waitForMoney = () => {
        const enoughMoney = checkFunction(playerId, price);
        if (enoughMoney !== undefined) {
          return resolve(enoughMoney);
        }
        setTimeout(waitForMoney, 30);
      };
      waitForMoney();
    });
  }

  handleChooseBlock(block, isHide, goNext) {
    if (isHide || (this.online && this.playingId !== this.myName)) return;

    if (this.gameState.startsWith(GAME_STATES.NEED_MONEY)) {
      this.sellingProperty = block.name;
      this.sendDataToChannel(["sellingProperty"]);
      return;
    }
    if (this.gameState.startsWith(GAME_STATES.CHOOSE_BUILDING)) {
      if (
        ["downgrade", "lostElectricity"].includes(
          this.gameState.split("--")[2]
        ) &&
        this.ownedBlocks[block.name]?.protected
      ) {
        this.updateOwnedBlockProtected(block.name, false);
        this.gameState = GAME_STATES.LOST_PROTECT + "--" + block.name;
        this.sendDataToChannel(["gameState", "ownedBlocks"]);

        delay(2000).then(() => {
          if (goNext) this.nextPlayerTurn();
        });
        return;
      }

      if (this.gameState.split("--")[2] === "festival") {
        this.festivalProperty.unshift(block.name);
        this.festivalProperty.length = 2;
      }

      if (this.gameState.split("--")[2] === "protect") {
        this.updateOwnedBlockProtected(block.name, true);
      }

      if (this.gameState.split("--")[2] === "lostElectricity") {
        this.updateOwnedBlockElectricity(block.name, 1);
      }

      if (this.gameState.split("--")[2] === "downgrade") {
        this.updateOwnedBlockLevel(block.name);
      }

      if (this.gameState.split("--")[2] === "fixElectricity") {
        this.updateOwnedBlockElectricity(block.name, 0);
      }

      if (this.gameState.split("--")[2] === "upgradeFree") {
        this.updateOwnedBlocks(block.name);
      }

      if (this.gameState.split("--")[2] === "travel") {
        const blockIndex = BLOCKS.findIndex((b) => b.name === block.name);
        this.flight(blockIndex);
      } else {
        this.gameState =
          GAME_STATES.CHOOSEN_BUILDING +
          "--" +
          block.name +
          "--" +
          this.gameState.split("--")[2];
        this.sendDataToChannel([
          "gameState",
          "festivalProperty",
          "ownedBlocks",
        ]);

        delay(2000).then(() => {
          if (goNext) this.nextPlayerTurn();
        });
      }

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
    this.host = isHost;
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
      broke: this.gameState !== GAME_STATES.WAITING,
    });
    if (this.players.length > this.totalPlayers) {
      this.players.length = this.totalPlayers;
    }
  }

  setPlayers(players) {
    this.players = players;
  }

  updateStore({ data = {}, type }) {
    if (!type) {
      Object.keys(data).forEach((key) => {
        if (key === "chat") {
          Object.keys(data[key]).forEach((name) => {
            const message = data[key][name];
            if (message.startsWith("/mm")) {
              SOUND["meme" + message.split("/mm ")[1]]?.play();
            } else {
              SOUND.chat.play();
            }
            this.chat[name] = data[key][name] + "--" + new Date().toISOString();
          });
        } else if (key === "loans") {
          this.updateLoans(data[key]);
        } else {
          this[key] = data[key];
        }
      });
      return;
    }
    if (type === "updateAvatar") {
      const player = this.players[this.getPlayerIndexById(data.playerId)];
      this.updatePlayerData(player, "avatar", data.avatar);
      return;
    }

    if (type === "updateMoney") {
      const player = this.players[this.getPlayerIndexById(data.playerId)];
      this.updatePlayerData(
        player,
        "money",
        data.inc ? player.money + data.money : player.money - data.money
      );
      return;
    }
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

  sendJoinSignalToChannel(version) {
    this.channel.send({
      type: "broadcast",
      event: "join",
      payload: {
        data: {
          playerName: this.myName,
          version,
        },
      },
    });
  }

  sendDataToChannel(key = SYNC_KEY) {
    const data = key.reduce((fullData, key) => {
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

  sendAvatarToChannel(avatar) {
    this.channel.send({
      type: "broadcast",
      event: "updateStore",
      payload: {
        type: "updateAvatar",
        data: {
          playerId: this.myName,
          avatar,
        },
      },
    });
  }

  sendMoneyToChannel(playerId, money, isInc) {
    this.channel.send({
      type: "broadcast",
      event: "updateStore",
      payload: {
        type: "updateMoney",
        data: {
          playerId,
          money,
          inc: isInc,
        },
      },
    });
  }

  updateLoans(loan) {
    if (!loan.from) return;
    this.loans[loan.from] = loan;
    if (loan.status === "request") {
      this.messageApi.open({
        key: loan.id,
        type: "loading",
        content: (
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "end",
            }}
          >
            <div style={{ display: "flex" }}>
              <strong
                style={{
                  color: COLORS[this.getPlayerIndexById(loan.from)],
                  padding: "0 4px",
                }}
              >
                {loan.from}
              </strong>
              muốn xin
              <strong
                style={{
                  color: COLORS[this.getPlayerIndexById(loan.to)],
                  padding: "0 4px",
                }}
              >
                {loan.to !== this.myName ? loan.to : "bạn"}
              </strong>
              số tiền <strong style={{ padding: "0 4px" }}>{BEG_MONEY}$</strong>
            </div>
            {loan.to === this.myName && (
              <div>
                <Button
                  onClick={() => {
                    const newLoan = {
                      ...loan,
                      status: "fail",
                    };
                    this.loans[loan.from] = newLoan;
                    this.channel.send({
                      type: "broadcast",
                      event: "updateStore",
                      payload: {
                        data: {
                          loans: newLoan,
                        },
                      },
                    });
                    this.messageApi.destroy(loan.id);
                  }}
                  type="primary"
                  danger
                >
                  Từ chối
                </Button>
                <Button
                  onClick={async () => {
                    this.messageApi.destroy(loan.id);
                    const newLoan = {
                      ...loan,
                      status: "success",
                    };
                    this.loans[loan.from] = newLoan;

                    this.updatePlayerData(
                      this.players[this.getPlayerIndexById(newLoan.to)],
                      "money",
                      this.players[this.getPlayerIndexById(newLoan.to)].money -
                        BEG_MONEY
                    );

                    this.updatePlayerData(
                      this.players[this.getPlayerIndexById(newLoan.from)],
                      "money",
                      this.players[this.getPlayerIndexById(newLoan.from)]
                        .money + BEG_MONEY
                    );
                    this.sendMoneyToChannel(newLoan.to, BEG_MONEY, false);
                    this.sendMoneyToChannel(newLoan.from, BEG_MONEY, true);
                    this.channel
                      .send({
                        type: "broadcast",
                        event: "updateStore",
                        payload: {
                          data: {
                            loans: newLoan,
                          },
                        },
                      })
                      .then(() => SOUND[GAME_STATES.INC_MONEY].play());
                  }}
                  type="primary"
                  style={{ marginLeft: 15 }}
                >
                  Cho
                </Button>
              </div>
            )}
          </div>
        ),
        duration: 0,
        style: {
          marginTop: "45vh",
          backgroundColor: "transparent",
        },
      });
    } else if (loan.status === "fail") {
      this.messageApi
        .open({
          type: "error",
          content: (
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "end",
              }}
            >
              <div style={{ display: "flex" }}>
                <strong
                  style={{
                    color: COLORS[this.getPlayerIndexById(loan.to)],
                    padding: "0 4px",
                  }}
                >
                  {loan.to !== this.myName ? loan.to : "bạn"}
                </strong>
                đã từ chối cho
                <strong
                  style={{
                    color: COLORS[this.getPlayerIndexById(loan.from)],
                    padding: "0 4px",
                  }}
                >
                  {loan.from}
                </strong>
                tiền
              </div>
            </div>
          ),
          duration: 2,
        })
        .then(() => this.messageApi.destroy(loan.id));
    } else if (loan.status === "success") {
      SOUND[GAME_STATES.INC_MONEY].play();
      this.messageApi
        .open({
          type: "success",
          content: (
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "end",
              }}
            >
              <div style={{ display: "flex" }}>
                <strong
                  style={{
                    color: COLORS[this.getPlayerIndexById(loan.to)],
                    padding: "0 4px",
                  }}
                >
                  {loan.to !== this.myName ? loan.to : "bạn"}
                </strong>
                đã cho
                <strong
                  style={{
                    color: COLORS[this.getPlayerIndexById(loan.from)],
                    padding: "0 4px",
                  }}
                >
                  {loan.from}
                </strong>
                {BEG_MONEY}$
              </div>
            </div>
          ),
          duration: 2,
        })
        .then(() => this.messageApi.destroy(loan.id));
    }
  }

  getRebuyPrice(block) {
    const updatingPropertyInfo = this.ownedBlocks[block.name];
    return (
      parseInt(
        range(0, updatingPropertyInfo.level).reduce((total, currentIdx) => {
          total += block.price[currentIdx];
          return total;
        }, 0) *
          (REBUY_RATE +
            updatingPropertyInfo.level / 10 +
            (this.isMonopolyBlock(block) ? 0.3 : 0))
      ) * (this.festivalProperty.includes(block.name) ? 2 : 1)
    );
  }

  getTotalMoneyPlayers() {
    const total = this.players.map((player) => {
      let money = player.money;
      const allBlock = Object.keys(this.ownedBlocks).filter(
        (blockName) => this.ownedBlocks[blockName].playerId === player.id
      );
      allBlock.forEach((blockName) => {
        const block = BLOCKS.find((b) => b.name === blockName);
        const blockSellPrice = parseInt(
          range(0, this.ownedBlocks[blockName].level).reduce(
            (total, currentIdx) => {
              total += block.price[currentIdx];
              return total;
            },
            0
          )
        );
        money += blockSellPrice;
      });
      return {
        id: player.id,
        total: money,
      };
    });

    return orderBy(total, "total", "desc");
  }

  setCameraRef(ref) {
    this.cameraRef = ref;
  }

  setCameraKey(key) {
    this.cameraKey = key + "__" + uuidv4();
  }

  setMessageApi(api) {
    this.messageApi = api;
  }

  transformAndSetRoomList(data) {
    this.roomList = Object.values(data).map((room) => get(room, ["0", "data"]));
  }

  setSync(sync) {
    this.sync = sync;
  }

  addAndTrack(key, version) {
    if (
      this.players.length + 1 <= this.totalPlayers &&
      this.players.findIndex((p) => p.name === key) === -1
    ) {
      this.addPlayer(key);
    }
    this.sendDataToChannel();
    this.waitingRoomChannel.track({
      data: {
        roomId: this.roomId,
        totalPlayers: this.players.length,
        hostName: this.myName,
        version,
        store: pick(this, SYNC_KEY),
      },
    });
  }

  setUpRoom(supabase) {
    this.channel = supabase.channel(this.roomId.trim(), {
      config: {
        presence: {
          key: this.myName,
        },
      },
    });
    this.waitingRoomChannel = supabase.channel("waiting-room", {
      config: {
        presence: {
          key: this.roomId,
        },
      },
    });
    if (this.isHost) {
      this.updateGameState(GAME_STATES.WAITING);
      this.setPlayers([]);
      this.addPlayer(this.myName);
      this.hostName = this.myName;
      this.waitingRoomChannel.subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        this.waitingRoomChannel.track({
          data: {
            roomId: this.roomId,
            totalPlayers: this.players.length,
            hostName: this.myName,
            version: packageJson.version,
            store: pick(this, SYNC_KEY),
          },
        });
      });
    }

    this.channel
      .on("broadcast", { event: "updateStore" }, (payload) => {
        this.updateStore(get(payload, ["payload"], {}));
        if (this.isHost) {
          this.waitingRoomChannel.track({
            data: {
              roomId: this.roomId,
              totalPlayers: this.players.length,
              hostName: this.myName,
              version: packageJson.version,
              store: pick(this, SYNC_KEY),
            },
          });
        }
      })
      .on("broadcast", { event: "join" }, (payload) => {
        if (!this.isHost) return;
        const playerName = get(payload, ["payload", "data", "playerName"], {});
        const playerVersion = get(payload, ["payload", "data", "version"], {});
        if (playerVersion === packageJson.version) {
          this.addAndTrack(playerName, packageJson.version);
        }
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key !== this.myName) {
          this.messageApi.open({
            type: "success",
            content: `${key} đã tham gia phòng`,
          });
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key !== this.myName) {
          this.messageApi.open({
            type: "warning",
            content: `${key} đã rời khỏi phòng`,
          });
        }

        if (key === this.hostName) {
          let nextId = this.getPlayerIndexById(this.hostName) + 1;
          if (nextId >= this.players.length) {
            nextId = 0;
          }
          this.hostName = this.players[nextId].name;

          if (this.isHost) {
            this.waitingRoomChannel.subscribe((status) => {
              if (status !== "SUBSCRIBED") {
                return;
              }

              this.waitingRoomChannel.track({
                data: {
                  roomId: this.roomId,
                  totalPlayers: this.players.length,
                  hostName: this.myName,
                  version: packageJson.version,
                  store: pick(this, SYNC_KEY),
                },
              });
            });
          }
        }
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        if (!this.isHost) {
          this.sendJoinSignalToChannel(packageJson.version);
        }

        this.channel.track({ online_at: new Date().toISOString() });
      });
  }

  get isHost() {
    return this.host || this.myName === this.hostName;
  }
}

class Reset {
  loans = {};
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
  cameraKey = "reset";
}

const storeInstance = new MainStore();

export default storeInstance;
