import { Button } from "antd";
import { random, range, get } from "lodash";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import {
  BLOCKS,
  COLORS,
  GAME_STATES,
  randomPropertyIndex,
  REBUY_RATE,
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
  roomList = []

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

  getPrice(block = {}, level, isSelling) {
    if (!["public", "property"].includes(block.type)) return;
    const prices = block?.price;
    level = level || this.ownedBlocks[block.name]?.level;
    if (!this.ownedBlocks[block.name]) return;

    const rate = [0.2, 1, 2, 3, 4, 1.5];
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
      this.gameState =
        GAME_STATES.CHOOSEN_BUILDING +
        "--" +
        block.name +
        "--" +
        this.gameState.split("--")[2];
      this.sendDataToChannel();

      delay(2000).then(() => {
        if (callback) callback();
      });

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
    if (!this.isHost || this.gameState !== GAME_STATES.END) return;
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

  sendDataToChannel() {
    const data = SYNC_KEY.reduce((fullData, key) => {
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
              muốn mượn
              <strong
                style={{
                  color: COLORS[this.getPlayerIndexById(loan.to)],
                  padding: "0 4px",
                }}
              >
                {loan.to !== this.myName ? loan.to : "bạn"}
              </strong>
              số tiền <strong style={{ padding: "0 4px" }}>2000$</strong> và sẽ
              trả <strong style={{ padding: "0 4px" }}>2500$</strong> sau
              <strong style={{ padding: "0 4px" }}>10</strong> lượt đi
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
                        2000
                    );

                    this.updatePlayerData(
                      this.players[this.getPlayerIndexById(newLoan.from)],
                      "money",
                      this.players[this.getPlayerIndexById(newLoan.from)]
                        .money + 2000
                    );
                    this.updatePlayerData(
                      this.players[this.getPlayerIndexById(newLoan.from)],
                      "loan",
                      { turnLeft: 9, price: 2500, to: newLoan.to }
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
                  Cho mượn
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
                mượn tiền
              </div>
            </div>
          ),
          duration: 1,
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
                mượn 2000$
              </div>
            </div>
          ),
          duration: 1,
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
          (REBUY_RATE + updatingPropertyInfo.level / 10)
      ) * (this.festivalProperty.includes(block.name) ? 2 : 1)
    );
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
    this.roomList = Object.values(data).map(room => get(room, ['0', 'data']))
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
  cameraKey = "reset";
}

const storeInstance = new MainStore();

export default storeInstance;
