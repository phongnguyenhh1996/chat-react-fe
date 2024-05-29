import { Button } from "antd";
import { random, range, get, orderBy, pick, keyBy } from "lodash";
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
];

class MainStore {
  online = true;
  isHost = false;
  myName = localStorage.getItem("myName") || "Player 1";
  roomId = random(1000, 9999).toString();
  channel = null;
  showChat = false;
  cameraRef = null;
  messageApi = null;
  roomList = [];
  sync = false;

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
    // this.movingPlayer(() => {}, 36);
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
          this.sendDataToChannel(["players", "gameState"]);
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
    const currentRound = Math.floor((this.currentPlayer.position - 1) / 36);
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
    if (idx > 35) {
      idx = idx % 36;
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
              this.sendDataToChannel(["gameState", "players"]);
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
        this.sendDataToChannel(["gameState", "players"]);
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
    const round = Math.floor((this.currentPlayer.position - 1) / 36);
    const currentRoundDestination = round * 36 + (destinationIndex + 1);
    let position = currentRoundDestination;
    if (position <= this.currentPlayer.position) {
      position += 36;
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
    this.sendDataToChannel(["gameState", "players"]);
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
      const round = Math.floor((this.currentPlayer.position - 1) / 36);
      const currentRoundDestination = round * 36 + (idx + 1);
      let position = currentRoundDestination;
      if (position <= this.currentPlayer.position) {
        position += 36;
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
    let tax = [500, 1000][random(0, 1)];
    if (this.currentPlayer.money - tax < 0) {
      tax = yield this.handleNotEnoughMoney(this.currentPlayer, tax);
    }
    this.updatePlayerData(
      this.currentPlayer,
      "money",
      this.currentPlayer.money - tax
    );
    this.updateGameState(GAME_STATES.DEC_MONEY + "--" + tax + "--bank--tax");
    this.sendDataToChannel(["gameState", "players"]);
    yield delay(2000);
    this.nextPlayerTurn();
  }
  getJailPosition(player) {
    return Math.floor(player.position / 36) * 36 + 12;
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
    const position = random(this.currentPlayer.position - 1, round * 36 + 1);
    this.updateGameState(
      GAME_STATES.GOING_BACK + "--" + (this.currentPlayer.position - position)
    );
    this.sendDataToChannel(["gameState"]);
    yield delay(2000);
    this.movingPlayer(() => {}, position);
  }
  *randomDowngrade() {
    const allOwnedBlockKeys = Object.keys(this.ownedBlocks).filter(
      (key) => this.ownedBlocks[key].playerId === this.currentPlayer.id
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
      (key) => this.ownedBlocks[key].playerId === this.currentPlayer.id
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

  checkEndGame() {
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
      let state;
      if (
        rows.public?.length === 3 &&
        p.id &&
        (p.almostWin || "").split("--")[1] !== "four-public"
      ) {
        state =
          GAME_STATES.ALMOST_END + "--four-public--" + p.id + '--["public"]';
        this.updatePlayerData(p, "almostWin", state);
        return;
      }
      const allmostWinRows = Object.keys(rows).filter(
        (key) =>
          rows[key].length === BLOCKS.filter((b) => b.row === key).length &&
          key !== "public"
      );
      const blockOrderByRow = keyBy(BLOCKS, "row");
      const rowAlmostDone = Object.keys(blockOrderByRow).find(
        (key) => blockOrderByRow[key].length === rows[key].length + 1
      );
      if (allmostWinRows.length === 2 && rowAlmostDone) {
        state =
          GAME_STATES.ALMOST_END +
          "--three-monopoly--" +
          p.id +
          "--" +
          JSON.stringify([...allmostWinRows, rowAlmostDone]);
        this.updatePlayerData(p, "almostWin", state);
        return;
      }
    });
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
      this.sendDataToChannel(["players", "ownedBlocks", "gameState"]);
    }

    yield delay(2000);
    const prevPlayerState = this.currentPlayer.almostWin
    this.checkEndGame();
    if (this.currentPlayer.almostWin && this.currentPlayer.almostWin !== prevPlayerState) {
      this.updateGameState(this.currentPlayer.almostWin)
      this.sendDataToChannel(["gameState"]);
      yield delay(6000);
    }
    if (
      (this.ownedBlocks[this.buyingProperty]?.level < 2 || isRebuy) &&
      this.buyingPropertyInfo.type === "property" &&
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
    this.updateOwnedBlockLevel(this.sellingProperty);
    this.updateGameState(
      GAME_STATES.NEED_MONEY + "_inc--" + price + "--" + this.currentPlayer.id
    );
    this.sendDataToChannel([
      "gameState",
      "ownedBlocks",
      "players",
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
    data[key] = value;
  }

  updateGameState(state) {
    this.gameState = state;
  }

  updatePlayingId(id) {
    this.playingId = id;
  }

  randomDice() {
    console.log("total:", this.getTotalMoneyPlayers());

    if (
      this.currentPlayer.position <= 36 * 2 + 1 &&
      this.currentPlayer.id === this.myName
    ) {
      let luckyDices = [];
      for (let x = 1; x <= 6; x++) {
        for (let y = 1; y <= 6; y++) {
          let idx = this.currentPlayer.position + x + y - 1;
          if (idx > 35) {
            idx = idx % 36;
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
    return new Promise(function (resolve) {
      (function waitForMoney() {
        const enoughMoney = checkFunction(playerId, price);
        if (enoughMoney) return resolve(true);
        if (enoughMoney === false) return resolve(false);
        setTimeout(waitForMoney, 30);
      })();
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
      if (this.gameState.split("--")[2] === "festival") {
        this.festivalProperty.unshift(block.name);
        this.festivalProperty.length = 2;
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
      broke: this.gameState !== GAME_STATES.WAITING,
    });
    if (this.players.length > this.totalPlayers) {
      this.players.length = this.totalPlayers;
    }
  }

  setPlayers(players) {
    this.players = players;
  }

  updateStore(data) {
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
                    this.channel
                      .send({
                        type: "broadcast",
                        event: "updateStore",
                        payload: {
                          data: {
                            loans: newLoan,
                            players: this.players,
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

  addAndTrack(key, waitingRoomChannel, version) {
    if (
      this.players.length + 1 <= this.totalPlayers &&
      this.players.findIndex((p) => p.name === key) === -1
    ) {
      this.addPlayer(key);
    }
    this.sendDataToChannel();
    waitingRoomChannel.track({
      data: {
        roomId: this.roomId,
        totalPlayers: this.players.length,
        hostName: this.myName,
        version,
        store: pick(this, SYNC_KEY),
      },
    });
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
