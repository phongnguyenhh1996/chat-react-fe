import React, { useEffect } from "react";
import { debounce, get, pick, random, range } from "lodash";
import {
  Button,
  Modal,
  InputNumber,
  Input,
  Popconfirm,
  Switch,
  Popover,
} from "antd";
import { observer } from "mobx-react-lite";
import MainStore from "./MainStore";
import { AVATARS, BLOCKS, COLORS, GAME_STATES } from "./constants";
import { delay, getBlockPositionStyle } from "./utils";
import Die from "../../components/Dice";
import Block from "./Block";
import PlayerInfor from "./PlayerInfor";
import Icon from "../../components/Icon";
import { createClient } from "@supabase/supabase-js";
import moment from "moment";

const supabase = createClient(
  "https://vqjkcypfolcemvcxpgdw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxamtjeXBmb2xjZW12Y3hwZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ4NzI0MjQsImV4cCI6MjAzMDQ0ODQyNH0.OYfrix-OpHrloU60t4WTyuUTVpMtk9pD89wiQ0DeoQ4"
);

const Dashboard = () => {
  const handleOk = async () => {
    if (!MainStore.online) {
      MainStore.updateGameState(GAME_STATES.ROLL_DICE);
      MainStore.updatePlayingId(
        MainStore.players[random(0, MainStore.players.length - 1)].id
      );
      MainStore.setChannel(supabase.channel("nothing"));
    } else {
      MainStore.setChannel(
        supabase.channel(MainStore.roomId.trim(), {
          config: {
            presence: {
              key: MainStore.isHost ? "host" : MainStore.myName,
            },
          },
        })
      );
      MainStore.updateGameState(GAME_STATES.WAITING);
      if (MainStore.isHost) {
        MainStore.setPlayers([]);
        MainStore.addPlayer(MainStore.myName);
        MainStore.channel
          .on("broadcast", { event: "updateStore" }, (payload) => {
            MainStore.updateStore(get(payload, ["payload", "data"], {}));
          })
          .on("presence", { event: "join" }, ({ key }) => {
            if (key === "host" || MainStore.gameState !== GAME_STATES.WAITING) {
              return;
            }
            MainStore.addPlayer(key);
            if (MainStore.players.length === MainStore.totalPlayers) {
              MainStore.updatePlayingId(
                MainStore.players[random(0, MainStore.players.length - 1)].id
              );
              MainStore.updateGameState(GAME_STATES.ROLL_DICE);
            }
            MainStore.channel.track({
              data: pick(MainStore, [
                "gameState",
                "players",
                "playingId",
                "totalPlayers",
                "festivalProperty",
                "flightDestination",
              ]),
            });
          })
          .subscribe(async (status) => {
            if (status !== "SUBSCRIBED") {
              return;
            }

            await MainStore.channel.track({
              data: pick(MainStore, [
                "totalPlayers",
                "startMoney",
                "gameState",
                "flightDestination",
                "players",
                "festivalProperty",
              ]),
            });
          });
      } else {
        MainStore.channel
          .on("broadcast", { event: "updateStore" }, (payload) => {
            MainStore.updateStore(get(payload, ["payload", "data"], {}));
          })
          .on("presence", { event: "sync" }, ({ key }) => {
            if (
              key === MainStore.myName ||
              MainStore.playingId === MainStore.myName
            ) {
              return;
            }
            const newState = MainStore.channel.presenceState();
            MainStore.updateStore(get(newState, ["host", "0", "data"], {}));
          })
          .subscribe(async (status) => {
            if (status !== "SUBSCRIBED") {
              return;
            }

            await MainStore.channel.track({
              online_at: new Date().toISOString(),
            });
          });
      }
    }
  };

  const currentPlayerIndex = MainStore.players.findIndex(
    (p) => p.id === MainStore.playingId
  );
  const currentPlayer = MainStore.players[currentPlayerIndex];

  const getJailPosition = (player) => {
    return Math.floor(player.position / 36) * 36 + 12;
  };

  const goToJail = async () => {
    MainStore.updateGameState(GAME_STATES.GOING_JAIL);
    MainStore.sendDataToChannel(["gameState"]);
    await delay(2000);
    MainStore.updatePlayerData(
      currentPlayer,
      "position",
      getJailPosition(currentPlayer)
    );
    MainStore.updatePlayerData(currentPlayer, "onJail", 1);
    MainStore.sendDataToChannel(["players"]);
    nextPlayerTurn(true);
  };

  const goNextAvailablePlayer = () => {
    MainStore.setSamePlayerRolling(1);
    let nextPlayerIndex = currentPlayerIndex + 1;
    if (nextPlayerIndex >= MainStore.players.length) {
      nextPlayerIndex = 0;
    }
    while (
      MainStore.players[nextPlayerIndex] &&
      MainStore.players[nextPlayerIndex].broke
    ) {
      nextPlayerIndex += 1;
      if (nextPlayerIndex >= MainStore.players.length) {
        nextPlayerIndex = 0;
      }
    }
    MainStore.updatePlayingId(MainStore.players[nextPlayerIndex].id);
    MainStore.updateGameState(GAME_STATES.ROLL_DICE);
    MainStore.sendDataToChannel([
      "playingId",
      "samePlayerRolling",
      "gameState",
    ]);
  };

  const nextPlayerTurn = async (forceSwitch) => {
    MainStore.updateGameState(GAME_STATES.SWITCH_TURN);
    MainStore.sendDataToChannel(["gameState"]);
    await delay(100);
    if (forceSwitch || currentPlayer.broke) {
      goNextAvailablePlayer();
      return;
    }
    if (MainStore.dice[0] === MainStore.dice[1]) {
      MainStore.setSamePlayerRolling(MainStore.samePlayerRolling + 1);
      if (MainStore.samePlayerRolling > 3) {
        goToJail();
      } else {
        MainStore.updateGameState(GAME_STATES.ROLL_DICE);
      }
      MainStore.sendDataToChannel(["gameState", "samePlayerRolling"]);
    } else {
      goNextAvailablePlayer();
    }
  };

  const checkNewRound = async () => {
    const round = currentPlayer.round || 0;
    const currentRound = Math.floor((currentPlayer.position - 1) / 36);
    if (currentRound > round) {
      MainStore.updatePlayerData(
        currentPlayer,
        "money",
        currentPlayer.money + 2000
      );
      MainStore.updatePlayerData(currentPlayer, "round", currentRound);
      MainStore.updateGameState(
        GAME_STATES.INC_MONEY + "--2000--bank--new-round"
      );
      MainStore.sendDataToChannel(["gameState", "players"]);
      await delay(2000);
      checkCurrentBlock();
    } else checkCurrentBlock();
  };

  const checkCurrentBlock = async () => {
    let idx = currentPlayer.position - 1;
    if (idx > 35) {
      idx = idx % 36;
    }
    const block = BLOCKS[idx] || {};
    if (block.type === "property" || block.type === "public") {
      const ownedBlock = MainStore.ownedBlocks[block.name];
      if (!ownedBlock) {
        MainStore.updateBuyingProperty(block.name);
        MainStore.sendDataToChannel(["buyingProperty"]);
        await delay(1000);
        MainStore.updateGameState(GAME_STATES.BUYING);
        MainStore.sendDataToChannel(["gameState"]);
      } else {
        if (ownedBlock.playerId !== currentPlayer.id) {
          const receivePlayer =
            MainStore.players[
              MainStore.getPlayerIndexById(ownedBlock.playerId)
            ];
          if (!receivePlayer.onJail) {
            if (ownedBlock.lostElectricity > 0) {
              MainStore.updateGameState(GAME_STATES.CURRENT_LOST_ELECTRIC);
              MainStore.updateOwnedBlockElectricity(block.name);
              MainStore.sendDataToChannel(["gameState", "ownedBlocks"]);
            } else {
              let price = MainStore.getPrice(block);
              if (currentPlayer.money - price < 0) {
                price = await handleNotEnoughMoney(currentPlayer, price);
              }
              MainStore.updatePlayerData(
                currentPlayer,
                "money",
                currentPlayer.money - price
              );

              MainStore.updatePlayerData(
                receivePlayer,
                "money",
                receivePlayer.money + price
              );

              MainStore.updateGameState(
                GAME_STATES.DEC_MONEY + "--" + price + "--" + receivePlayer.id
              );
              MainStore.sendDataToChannel(["gameState", "players"]);
              if (block.type === "property" && !currentPlayer.broke) {
                await delay(2000);
                MainStore.updateBuyingProperty(block.name);
                MainStore.updateGameState(GAME_STATES.BUYING);
                MainStore.sendDataToChannel(["gameState", "buyingProperty"]);
                return;
              }
            }
          } else {
            MainStore.updateGameState(GAME_STATES.RECEIVER_ON_JAIL);
            MainStore.sendDataToChannel(["gameState"]);
          }
          await delay(2000);
          nextPlayerTurn();
        } else {
          if (block.type === "public") {
            await delay(2000);
            nextPlayerTurn();
            return;
          }
          if (ownedBlock?.level === 6) {
            MainStore.updateGameState(GAME_STATES.MAX_LEVEL_PROPERTY);
            MainStore.sendDataToChannel(["gameState"]);
            await delay(2000);
            nextPlayerTurn();
          } else {
            MainStore.updateBuyingProperty(block.name);
            MainStore.sendDataToChannel(["buyingProperty"]);
            await delay(1000);
            MainStore.updateGameState(GAME_STATES.UPDATING);
            MainStore.sendDataToChannel(["gameState"]);
          }
        }
      }
      return;
    }

    if (block.type === "jail") {
      goToJail();
      return;
    }

    if (block.type === "jail-visit") {
      const totalPlayerOnJail = MainStore.players.filter(
        (p) => p.onJail > 0
      ).length;
      if (totalPlayerOnJail > 0) {
        let price = totalPlayerOnJail * 200;
        if (currentPlayer.money - price < 0) {
          price = await handleNotEnoughMoney(currentPlayer, price);
        }
        MainStore.updatePlayerData(
          currentPlayer,
          "money",
          currentPlayer.money - price
        );
        MainStore.updateGameState(
          GAME_STATES.DEC_MONEY + "--" + price + "--bank--jail-visit"
        );
        MainStore.sendDataToChannel(["gameState", "players"]);
        await delay(2000);
      }
      nextPlayerTurn();
      return;
    }

    if (block.type === "badluck") {
      await [
        async () => {
          let tax = [500, 1000][random(0, 1)];
          if (currentPlayer.money - tax < 0) {
            tax = await handleNotEnoughMoney(currentPlayer, tax);
          }
          MainStore.updatePlayerData(
            currentPlayer,
            "money",
            currentPlayer.money - tax
          );
          MainStore.updateGameState(
            GAME_STATES.DEC_MONEY + "--" + tax + "--bank--tax"
          );
          MainStore.sendDataToChannel(["gameState", "players"]);
          await delay(2000);
          nextPlayerTurn();
        },
        goToJail,
        async () => {
          const round = currentPlayer.round || 0;
          const position = random(currentPlayer.position - 1, round * 36 + 2);
          MainStore.updateGameState(
            GAME_STATES.GOING_BACK + "--" + (currentPlayer.position - position)
          );
          MainStore.sendDataToChannel(["gameState"]);
          await delay(2000);
          movingPlayer(() => {}, position);
        },
        async () => {
          const allOwnedBlockKeys = Object.keys(MainStore.ownedBlocks).filter(
            (key) => MainStore.ownedBlocks[key].playerId === currentPlayer.id
          );
          if (allOwnedBlockKeys.length === 0) {
            MainStore.updateGameState(
              GAME_STATES.DOWN_GRADE_BUILDING + "--no-property"
            );
            MainStore.sendDataToChannel(["gameState"]);
            await delay(2000);
            nextPlayerTurn();
            return;
          }
          const randomKey =
            allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
          MainStore.updateGameState(
            GAME_STATES.DOWN_GRADE_BUILDING + "--" + randomKey
          );
          MainStore.sendDataToChannel(["gameState"]);
          await delay(2000);
          const price = getSellingPrice(randomKey);
          MainStore.updatePlayerData(
            currentPlayer,
            "money",
            parseInt(currentPlayer.money + price)
          );
          MainStore.updateOwnedBlockLevel(randomKey);
          MainStore.updateGameState(
            GAME_STATES.INC_MONEY + "--" + price + "--bank"
          );
          MainStore.sendDataToChannel([
            "gameState",
            "players",
            "sellingProperty",
            "ownedBlocks",
          ]);
          await delay(2000);
          nextPlayerTurn();
        },
        async () => {
          const allOwnedBlockKeys = Object.keys(MainStore.ownedBlocks).filter(
            (key) => MainStore.ownedBlocks[key].playerId === currentPlayer.id
          );
          MainStore.updateGameState(GAME_STATES.LOST_ELECTRIC_BUILDING);
          MainStore.sendDataToChannel(["gameState"]);
          await delay(2000);
          if (allOwnedBlockKeys.length > 0) {
            const randomKey =
              allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
            MainStore.updateOwnedBlockElectricity(randomKey, 1);
            MainStore.sendDataToChannel(["ownedBlocks"]);
          }
          nextPlayerTurn();
          return;
        },
      ][random(0, 4)]();
      return;
    }

    if (block.type === "chance") {
      await [
        async () => {
          const gift = [500, 1000][random(0, 1)];
          MainStore.updatePlayerData(
            currentPlayer,
            "money",
            currentPlayer.money + gift
          );
          MainStore.updateGameState(
            GAME_STATES.INC_MONEY + "--" + gift + "--bank--gift"
          );
          MainStore.sendDataToChannel(["gameState", "players"]);
          await delay(2000);
          nextPlayerTurn();
        },
        async () => {
          MainStore.updateGameState(GAME_STATES.FREE_OUT_FAIL_CARD);
          MainStore.sendDataToChannel(["gameState"]);
          await delay(2000);
          MainStore.updatePlayerData(currentPlayer, "haveFreeCard", true);
          MainStore.sendDataToChannel(["players"]);
          nextPlayerTurn();
          return;
        },
        async () => {
          const allOwnedBlockKeys = Object.keys(MainStore.ownedBlocks).filter(
            (key) =>
              MainStore.ownedBlocks[key].playerId === currentPlayer.id &&
              MainStore.ownedBlocks[key].lostElectricity
          );
          if (allOwnedBlockKeys.length > 0) {
            const randomKey =
              allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
            MainStore.updateOwnedBlockElectricity(randomKey, 0);
            MainStore.updateGameState(
              GAME_STATES.FIXING_ELECTRIC_BUILDING + "--" + randomKey
            );
            MainStore.sendDataToChannel(["players", "ownedBlocks"]);
            await delay(2000);
          }
          MainStore.updatePlayerData(
            currentPlayer,
            "money",
            currentPlayer.money - 200
          );
          MainStore.updateGameState(
            GAME_STATES.DEC_MONEY + "--" + 200 + "--bank--fix-electric"
          );
          MainStore.sendDataToChannel(["players", "gameState"]);
          await delay(2000);
          nextPlayerTurn();
          return;
        },
        async () => {
          const allOwnedBlockKeys = Object.keys(MainStore.ownedBlocks).filter(
            (key) => MainStore.ownedBlocks[key].playerId === currentPlayer.id
          );
          MainStore.updateGameState(GAME_STATES.RANDOM_TRAVELING);
          MainStore.sendDataToChannel(["gameState"]);
          await delay(2000);
          if (allOwnedBlockKeys.length > 0) {
            const randomKey =
              allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
            const idx = BLOCKS.findIndex((b) => b.name === randomKey);
            const round = Math.floor((currentPlayer.position - 1) / 36);
            const currentRoundDestination = round * 36 + (idx + 1);
            let position = currentRoundDestination;
            if (position <= currentPlayer.position) {
              position += 36;
            }
            movingPlayer(() => {}, position);
          } else {
            MainStore.updatePlayerData(
              currentPlayer,
              "money",
              currentPlayer.money + 500
            );
            MainStore.updateGameState(
              GAME_STATES.INC_MONEY + "--" + 500 + "--bank"
            );
            MainStore.sendDataToChannel(["gameState", "players"]);
            await delay(2000);
            nextPlayerTurn();
          }
          return;
        },
        async () => {
          const allOwnedBlockKeys = Object.keys(MainStore.ownedBlocks).filter(
            (key) => MainStore.ownedBlocks[key].playerId === currentPlayer.id
          );
          if (allOwnedBlockKeys.length > 0) {
            MainStore.updateGameState(GAME_STATES.CHOOSE_FESTIVAL_BUILDING);
            MainStore.sendDataToChannel(["gameState"]);
          } else {
            MainStore.updateGameState(
              GAME_STATES.NO_BLOCK_TO_CHOOSE_FESTIVAL_BUILDING
            );
            MainStore.sendDataToChannel(["gameState"]);
            await delay(2000);
            nextPlayerTurn();
            return;
          }
        },
      ][random(0, 4)]();
      return;
    }

    if (block.type === "plane") {
      const round = Math.floor((currentPlayer.position - 1) / 36);
      const currentRoundDestination =
        round * 36 + (MainStore.flightDestination + 1);
      let position = currentRoundDestination;
      if (position <= currentPlayer.position) {
        position += 36;
      }

      MainStore.updateGameState(
        GAME_STATES.FLIGHT + "--" + MainStore.flightDestination
      );
      MainStore.sendDataToChannel(["gameState"]);
      await delay(2000);
      movingPlayer(MainStore.randomFlightDestination, position);
      return;
    }

    nextPlayerTurn();
  };

  const checkEndGame = () => {
    if (MainStore.players.filter((p) => !p.broke).length < 2) {
      const playerNotBroke = MainStore.players.find((p) => !p.broke);
      MainStore.updatePlayerData(playerNotBroke, "winner", true);
      MainStore.updatePlayerData(playerNotBroke, "winReason", "not-broke");
      MainStore.setEndGame(true);
      MainStore.sendDataToChannel(["players", "endGame"]);
      return;
    }

    let isFourPublic = false;
    let isThreeMonopoly = false;
    MainStore.players.forEach((p) => {
      const ownedBlocks = Object.keys(MainStore.ownedBlocks).filter(
        (key) => MainStore.ownedBlocks[key].playerId === p.id
      );
      let rows = {};
      ownedBlocks.forEach((key) => {
        const block = BLOCKS.find((b) => b.name === key);
        const rowKey = block.row || block.type;
        if (rows[rowKey]) {
          rows[rowKey] += 1;
        } else {
          rows[rowKey] = 1;
        }
      });
      isFourPublic = Object.values(rows).some((value) => value === 4);
      isThreeMonopoly =
        Object.keys(rows).filter((key) => rows[key] === 3 && key !== "public")
          .length === 3;
      if (isFourPublic || isThreeMonopoly) {
        MainStore.updatePlayerData(p, "winner", true);
        MainStore.updatePlayerData(
          p,
          "winReason",
          isFourPublic ? "four-public" : "three-monopoly"
        );
        MainStore.setEndGame(true);
        MainStore.sendDataToChannel(["players", "endGame"]);
        return;
      }
    });
  };

  const movingPlayer = async (callback, planeDestinationPostion) => {
    if (currentPlayer.onJail > 0) {
      if (MainStore.dice[0] === MainStore.dice[1]) {
        MainStore.updateGameState(GAME_STATES.GOING_OUT_JAIL);
        MainStore.updatePlayerData(currentPlayer, "onJail", 0);
        MainStore.sendDataToChannel(["players", "gameState"]);
        await delay(2000);
        nextPlayerTurn(true);
      } else {
        if (currentPlayer.haveFreeCard) {
          MainStore.updateGameState(GAME_STATES.USE_FREE_CARD);
          MainStore.updatePlayerData(currentPlayer, "haveFreeCard", false);
          MainStore.updatePlayerData(currentPlayer, "onJail", 0);
          MainStore.sendDataToChannel(["players", "gameState"]);
          await delay(2000);
          nextPlayerTurn(true);
          return;
        }
        MainStore.updatePlayerData(
          currentPlayer,
          "onJail",
          currentPlayer.onJail + 1
        );
        MainStore.sendDataToChannel(["players", "gameState"]);
        await delay(500);
        if (currentPlayer.onJail === 4) {
          let price = 500;
          if (currentPlayer.money - 500 < 0) {
            price = await handleNotEnoughMoney(currentPlayer, price);
          }
          MainStore.updatePlayerData(
            currentPlayer,
            "money",
            currentPlayer.money - price
          );
          MainStore.updatePlayerData(currentPlayer, "onJail", 0);
          MainStore.updateGameState(
            GAME_STATES.DEC_MONEY + `--${price}--bank--pay-out-jail`
          );
          MainStore.sendDataToChannel(["players", "gameState"]);
          await delay(2000);
          nextPlayerTurn(true);
          return;
        }
        MainStore.updateGameState(GAME_STATES.ASK_TO_PAY_TO_OUT_JAIL);
        MainStore.sendDataToChannel(["gameState"]);
        const playerPayToOutJail = await MainStore.ensureMoneyIsEnough(
          MainStore.checkPayToOutJail,
          currentPlayer.id
        );
        if (playerPayToOutJail) {
          MainStore.updatePlayerData(currentPlayer, "onJail", 3);
          MainStore.updatePlayerData(currentPlayer, "payToOutJail", undefined);
          MainStore.sendDataToChannel(["players"]);
          movingPlayer();
          return;
        }
        MainStore.updatePlayerData(currentPlayer, "payToOutJail", undefined);
        MainStore.sendDataToChannel(["players"]);
        nextPlayerTurn(true);
      }
      return;
    }
    const newPosition = planeDestinationPostion
      ? planeDestinationPostion
      : currentPlayer.position + MainStore.dice[0] + MainStore.dice[1];
    if (!planeDestinationPostion) {
      MainStore.updateGameState(GAME_STATES.MOVING);
      await delay(1000);
    }
    const moving = setInterval(
      () => {
        if (currentPlayer.position === newPosition) {
          clearInterval(moving);
          checkNewRound();
          if (callback) {
            callback();
          }
        } else {
          MainStore.updatePlayerData(
            currentPlayer,
            "position",
            currentPlayer.position +
              (newPosition > currentPlayer.position ? 1 : -1)
          );
          MainStore.sendDataToChannel(["players", "gameState"]);
        }
      },
      planeDestinationPostion ? 100 : 200
    );
  };

  const rollDice = async () => {
    if (
      MainStore.gameState !== GAME_STATES.ROLL_DICE ||
      (MainStore.online && MainStore.playingId !== MainStore.myName)
    )
      return;
    MainStore.updateGameState(GAME_STATES.ROLLING_DICE);
    const roll = setInterval(() => {
      MainStore.randomDice();
      MainStore.sendDataToChannel(["dice"]);
    }, 150);
    await delay(2000);
    clearInterval(roll);
    movingPlayer();
  };

  const buyingProperty = BLOCKS.find(
    (block) => block.name === MainStore.buyingProperty
  );

  const updatingPropertyInfo = MainStore.ownedBlocks[buyingProperty?.name] || {};

  const handleNotEnoughMoney = async (player, price) => {
    MainStore.updateGameState(GAME_STATES.NEED_MONEY + "----" + player.id);
    MainStore.setPriceNeedToPay(price);
    MainStore.sendDataToChannel(["priceNeedToPay", "gameState"]);
    const playerStillHaveMoney = await MainStore.ensureMoneyIsEnough(
      MainStore.checkMoney,
      player.id,
      price
    );
    if (!playerStillHaveMoney) {
      price = player.money;
      MainStore.updatePlayerData(player, "broke", true);
      MainStore.updatePlayerData(player, "position", 1);
      Object.keys(MainStore.ownedBlocks).forEach((key) => {
        if (MainStore.ownedBlocks[key].playerId === player.id) {
          MainStore.deleteOwnedBlock(key);
        }
      });
      MainStore.sendDataToChannel(["players", "ownedBlocks"]);
      checkEndGame();
    }
    await delay(1000);
    MainStore.resetSellingState();
    return price;
  };

  const isRebuy =
    updatingPropertyInfo?.playerId !== undefined &&
    updatingPropertyInfo.playerId !== MainStore.playingId;

  const buyProperty = async () => {
    let price = buyingProperty.price[updatingPropertyInfo?.level || 0];
    let receivePlayer;
    if (isRebuy) {
      price = updatingPropertyInfo.price * 1.5;
    }
    if (currentPlayer.money - price < 0) {
      await handleNotEnoughMoney(currentPlayer, price);
    }
    MainStore.updatePlayerData(
      currentPlayer,
      "money",
      currentPlayer.money - price
    );
    if (isRebuy) {
      receivePlayer =
        MainStore.players[
          MainStore.getPlayerIndexById(updatingPropertyInfo.playerId)
        ];
      MainStore.deleteOwnedBlock(buyingProperty.name);
      MainStore.updatePlayerData(
        receivePlayer,
        "money",
        receivePlayer.money + price
      );
      MainStore.updateGameState(
        GAME_STATES.DEC_MONEY + "--" + price + "--" + receivePlayer.id
      );
    }
    MainStore.updateOwnedBlocks(buyingProperty.name, price);
    MainStore.updateGameState(GAME_STATES.DEC_MONEY + "--" + price + "--bank");
    MainStore.updateGameState(
      GAME_STATES.DEC_MONEY +
        "--" +
        price +
        "--" +
        (isRebuy ? receivePlayer.id : "bank")
    );
    MainStore.sendDataToChannel(["players", "ownedBlocks", "gameState"]);
    await delay(2000);
    checkEndGame();
    if (
      MainStore.ownedBlocks[MainStore.buyingProperty]?.level < 3 &&
      buyingProperty.type === "property"
    ) {
      MainStore.updateGameState(GAME_STATES.UPDATING);
      MainStore.sendDataToChannel(["gameState"]);
    } else {
      nextPlayerTurn();
    }
  };

  const sellingProperty = BLOCKS.find(
    (block) => block.name === MainStore.sellingProperty
  );
  const sellingPropertyInfor = MainStore.ownedBlocks[MainStore.sellingProperty];

  const getSellingPrice = (key) => {
    const currentSellingProperty = key
      ? BLOCKS.find((block) => block.name === key)
      : sellingProperty;
    const currentSellingPropertyInfor = key
      ? MainStore.ownedBlocks[key]
      : sellingPropertyInfor;
    if (currentSellingProperty.type === "public")
      return currentSellingProperty.price[0];
    const price =
      currentSellingProperty.price[currentSellingPropertyInfor?.level - 1];
    return parseInt(price / 2);
  };

  const sellProperty = async () => {
    const price = getSellingPrice();
    MainStore.updatePlayerData(
      currentPlayer,
      "money",
      parseInt(currentPlayer.money + price)
    );
    MainStore.updateOwnedBlockLevel(MainStore.sellingProperty);
    MainStore.updateGameState(
      GAME_STATES.NEED_MONEY + "_inc--" + price + "--" + currentPlayer.id
    );
    MainStore.sendDataToChannel([
      "gameState",
      "ownedBlocks",
      "players",
      "sellingProperty",
    ]);
    await delay(1000);
  };

  const updatePayToOutJail = (payToOutJail) => {
    MainStore.updatePlayerData(currentPlayer, "payToOutJail", payToOutJail);
    MainStore.updateGameState(GAME_STATES.RESPONDED_PAY_OUT_JAIL);
    MainStore.sendDataToChannel(["gameState", "players"]);
  };

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Enter" && !MainStore.showChat) {
        debounce(MainStore.openChat, 100)();
      }
    });
  }, []);

  const sendChat = (e) => {
    e.preventDefault();
    if (e.target[0]?.value) {
      MainStore.addChat(
        MainStore.myName,
        e.target[0]?.value + "--" + new Date().toISOString()
      );
      MainStore.channel.send({
        type: "broadcast",
        event: "updateStore",
        payload: {
          data: {
            chat: { [MainStore.myName]: e.target[0]?.value },
          },
        },
      });
    }
    MainStore.closeChat();
  };

  const surrender = () => {
    const player =
      MainStore.players[MainStore.getPlayerIndexById(MainStore.myName)];
    MainStore.updatePlayerData(player, "broke", true);
    MainStore.updatePlayerData(player, "position", 1);
    Object.keys(MainStore.ownedBlocks).forEach((key) => {
      if (MainStore.ownedBlocks[key].playerId === player.id) {
        MainStore.deleteOwnedBlock(key);
      }
    });
    MainStore.sendDataToChannel(["ownedBlocks", "players"]);
    checkEndGame();
  };

  return (
    <div className="container-page">
      {BLOCKS.map((block, index) => (
        <Block
          nextPlayerTurn={nextPlayerTurn}
          key={block.name + index}
          block={block}
          idx={index}
        />
      ))}
      {MainStore.players.map(
        (player, index) =>
          !player.broke && (
            <div
              style={{
                ...getBlockPositionStyle(player.position - 1),
                opacity: MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY)
                  ? 0.5
                  : 1,
                pointerEvents: "none",
              }}
              className="player"
              key={player.id}
              id={player.id + "avatar"}
            >
              <Popover
                zIndex={
                  [...Object.values(MainStore.chat)]
                    .sort(
                      (a, b) =>
                        new Date(a.split("--")[1]) - new Date(b.split("--")[1])
                    )
                    .indexOf(MainStore.chat[player.id]) + 1
                }
                getPopupContainer={() =>
                  document.getElementById(player.id + "avatar")
                }
                content={
                  <div style={{ color: COLORS[index] }}>
                    {MainStore.chat[player.id]
                      ? MainStore.chat[player.id].split("--")[0]
                      : ""}
                  </div>
                }
                open={
                  MainStore.chat[player.id] &&
                  moment(MainStore.chat[player.id].split("--")[1])
                    .add("5", "second")
                    .isAfter(moment())
                }
                key={
                  player.id +
                  BLOCKS[(player.position - 1) % 36]?.position +
                  (MainStore.chat[player.id] || "no-message")
                }
              >
                <img
                  style={{
                    flex: window.innerWidth > 950 ? "0 0 25px" : "0 0 15px",
                    height: window.innerWidth > 950 ? 25 : 15,
                    position: "relative",
                    left: index === 0 || index === 2 ? -15 : undefined,
                    top:
                      index === 0 || index === 1
                        ? window.innerWidth > 950
                          ? -20
                          : -10
                        : undefined,
                    right: index === 1 || index === 3 ? -15 : undefined,
                    bottom:
                      (index === 2 || index === 3) && MainStore.totalPlayers > 2
                        ? -15
                        : undefined,
                  }}
                  alt=""
                  src={AVATARS[index]}
                />
              </Popover>
            </div>
          )
      )}
      <div
        style={{
          backgroundColor: MainStore.gameState.startsWith(
            GAME_STATES.NEED_MONEY
          )
            ? "#d8eeeb80"
            : "#d8eeeb",
        }}
        className="center-space"
      >
        {MainStore.online && (
          <form
            style={{
              position: "absolute",
              bottom: 30,
              width: "50%",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onSubmit={sendChat}
          >
            {!MainStore.showChat && (
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                Nhấn <strong>Enter</strong> để chat
              </div>
            )}
            {MainStore.showChat && (
              <Input
                style={{
                  width: "100%",
                }}
                autoFocus
                placeholder="Nhập nội dung chat"
                name="chat"
              />
            )}
          </form>
        )}
        {(!MainStore.online ||
          (MainStore.online &&
            MainStore.gameState !== GAME_STATES.WAITING &&
            !MainStore.players[MainStore.getPlayerIndexById(MainStore.myName)]
              ?.broke)) && (
          <Popconfirm
            title={!MainStore.online ? "Chơi lại" : "Đầu hàng"}
            description={`Bạn muốn ${
              !MainStore.online ? "hủy ván hiện tại và chơi lại" : "đầu hàng"
            } không?`}
            onConfirm={!MainStore.online ? MainStore.resetGame : surrender}
            okText={!MainStore.online ? "Chơi lại" : "Đầu hàng"}
            cancelText="Không"
          >
            <Button
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                opacity: MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY)
                  ? 0.5
                  : 1,
              }}
            >
              {!MainStore.online ? "Chơi lại" : "Đầu hàng"}
            </Button>
          </Popconfirm>
        )}

        {MainStore.gameState !== GAME_STATES.INIT && (
          <div className="information" onClick={rollDice}>
            <div
              className="information__row"
              style={{
                border: "2px solid black",
                width: "100%",
                minHeight: 50,
                padding: 5,
                marginTop: 10,
                backgroundColor: "gray",
                color: "white",
                fontWeight: "bold",
              }}
            >
              {MainStore.gameState === GAME_STATES.ROLL_DICE &&
                MainStore.samePlayerRolling === 1 &&
                (MainStore.playingId === MainStore.myName ||
                  !MainStore.online) &&
                "Chạm để tung xúc xắc"}
              {MainStore.gameState === GAME_STATES.ROLL_DICE &&
                MainStore.samePlayerRolling > 1 &&
                `Được tung lần ${MainStore.samePlayerRolling} do xúc xắc ra đôi`}
              {(MainStore.gameState === GAME_STATES.BUYING ||
                MainStore.gameState === GAME_STATES.UPDATING) &&
                buyingProperty &&
                (MainStore.playingId === MainStore.myName ||
                  !MainStore.online) && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    {MainStore.gameState === GAME_STATES.BUYING && (
                      <div>
                        Bạn có muốn mua {buyingProperty.name}{" "}
                        {isRebuy ? (
                          <>
                            của{" "}
                            <span
                              style={{
                                color:
                                  COLORS[
                                    MainStore.getPlayerIndexById(
                                      updatingPropertyInfo.playerId
                                    )
                                  ],
                              }}
                            >
                              {
                                MainStore.players[
                                  MainStore.getPlayerIndexById(
                                    updatingPropertyInfo.playerId
                                  )
                                ].name
                              }
                            </span>
                          </>
                        ) : (
                          ""
                        )}{" "}
                        với giá là{" "}
                        {isRebuy
                          ? updatingPropertyInfo.price * 2
                          : buyingProperty.price[0]}
                        $ ?
                      </div>
                    )}
                    {MainStore.gameState === GAME_STATES.UPDATING && (
                      <div>
                        Bạn có muốn nâng cấp {buyingProperty.name} lên{" "}
                        {updatingPropertyInfo.level === 5
                          ? "biệt thự"
                          : `nhà cấp ${updatingPropertyInfo.level}`}{" "}
                        với giá là{" "}
                        {buyingProperty.price[updatingPropertyInfo.level]}$ ?
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 10,
                      }}
                    >
                      <Button
                        onClick={() => nextPlayerTurn()}
                        type="primary"
                        danger
                      >
                        Không
                      </Button>
                      <Button type="primary" onClick={buyProperty}>
                        Có
                      </Button>
                    </div>
                  </div>
                )}
              {MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY) &&
                MainStore.sellingProperty &&
                (MainStore.playingId === MainStore.myName ||
                  !MainStore.online) && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <div style={{ display: "flex" }}>
                      <span>
                        Bạn muốn bán:{" "}
                        {sellingPropertyInfor?.level === 6 && "Biệt thự"}
                        {sellingPropertyInfor?.level === 1 && "Ô đất"}
                        {[2, 3, 4, 5].includes(sellingPropertyInfor.level) &&
                          `nhà cấp ${sellingPropertyInfor?.level - 1}`}{" "}
                        {sellingProperty.name}
                      </span>{" "}
                    </div>
                    <div>Tổng bán được: {getSellingPrice()}$</div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 10,
                      }}
                    >
                      <Button type="primary" onClick={sellProperty}>
                        OK
                      </Button>
                    </div>
                  </div>
                )}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[2] !== "bank" && (
                  <div>
                    Mất {MainStore.gameState.split("--")[1]}$ khi đi vào ô này
                  </div>
                )}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[2] === "bank" &&
                !MainStore.gameState.split("--")[3] && (
                  <div>Đã thanh toán {MainStore.gameState.split("--")[1]}$</div>
                )}
              {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) &&
                MainStore.gameState.split("--")[3] === "new-round" &&
                "Nhận được 2000$ vì qua vòng mới"}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[3] === "pay-out-jail" &&
                "Phải trả 500$ để ra tù"}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[3] === "fix-electric" &&
                "Mất 200$ phí sửa điện"}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[3] === "tax" &&
                `Phải nộp thuế ${MainStore.gameState.split("--")[1]}$`}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[3] === "jail-visit" &&
                `Đi thăm tù hết ${MainStore.gameState.split("--")[1]}$`}
              {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) &&
                MainStore.gameState.split("--")[3] === "gift" &&
                `Nhận được ${
                  MainStore.gameState.split("--")[1]
                }$ quà sinh nhật`}
              {MainStore.gameState === GAME_STATES.GOING_JAIL &&
                "Bị đưa vào tù"}
              {MainStore.gameState === GAME_STATES.GOING_OUT_JAIL &&
                "Được ra tù do xúc xắc ra đôi"}
              {MainStore.gameState === GAME_STATES.DOUBLE_TO_OUT &&
                `Cần xúc xắc ra đôi để ra tù!`}
              {MainStore.gameState === GAME_STATES.RECEIVER_ON_JAIL &&
                `Không mất tiền do chủ nhà đang ở tù`}
              {MainStore.gameState === GAME_STATES.MAX_LEVEL_PROPERTY &&
                `Không thể nâng cấp thêm do ô này đã đạt cấp độ tối đa`}
              {MainStore.gameState.startsWith(GAME_STATES.FLIGHT) &&
                `Được bay tới ô ${
                  BLOCKS[MainStore.gameState.split("--")[1]].name
                }`}
              {MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY) &&
                !MainStore.sellingProperty &&
                "Chọn ô đất muốn bán"}
              {MainStore.gameState.startsWith(GAME_STATES.GOING_BACK) &&
                `Bị đi lùi ${MainStore.gameState.split("--")[1]} bước`}
              {MainStore.gameState.startsWith(
                GAME_STATES.DOWN_GRADE_BUILDING
              ) && (
                <div>
                  Người chơi bị buộc bán 1 căn nhà.
                  <br />
                  {MainStore.gameState.split("--")[1] !== "no-property"
                    ? `Bị buộc bán 1 căn nhà ở ${
                        MainStore.gameState.split("--")[1]
                      }`
                    : "Không sỡ hữu căn nhà nào"}
                </div>
              )}
              {MainStore.gameState.startsWith(
                GAME_STATES.LOST_ELECTRIC_BUILDING
              ) && "Một ô ngẫu nhiên sẽ bị cắt điện"}
              {MainStore.gameState === GAME_STATES.CURRENT_LOST_ELECTRIC &&
                "Không mất tiền vì ô hiện tại đang mất điện"}
              {MainStore.gameState === GAME_STATES.FREE_OUT_FAIL_CARD &&
                "Được tặng thẻ ra tù miễn phí"}
              {MainStore.gameState === GAME_STATES.USE_FREE_CARD &&
                "Đã sử dụng thẻ ra tù"}
              {MainStore.gameState === GAME_STATES.ASK_TO_PAY_TO_OUT_JAIL &&
                (MainStore.playingId === MainStore.myName ||
                  !MainStore.online) && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <div>Bạn có muốn trả 500$ để ra tù không?</div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 10,
                      }}
                    >
                      <Button
                        onClick={() => updatePayToOutJail(false)}
                        type="primary"
                        danger
                      >
                        Không
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => updatePayToOutJail(true)}
                      >
                        Có
                      </Button>
                    </div>
                  </div>
                )}
              {MainStore.gameState === GAME_STATES.RANDOM_TRAVELING &&
                "Đi tới 1 ô của bạn ngẫu nhiên hoặc được tặng 500$ đi du lịch"}
              {MainStore.gameState.startsWith(
                GAME_STATES.FIXING_ELECTRIC_BUILDING
              ) && `Ô ${MainStore.gameState.split("--")[1]} đang được sửa điện`}
              {MainStore.gameState === GAME_STATES.CHOOSE_FESTIVAL_BUILDING &&
                "Vui lòng chọn một ô để tổ chức lễ hội"}
              {MainStore.gameState ===
                GAME_STATES.NO_BLOCK_TO_CHOOSE_FESTIVAL_BUILDING &&
                "Được chọn ô tổ chức lễ hội nhưng chưa có ô nào"}
            </div>
            <div className="information__row">
              {MainStore.gameState === GAME_STATES.WAITING && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: -45,
                      userSelect: "auto",
                      display: "flex",
                      alignItems: "center",
                      left: 0,
                      right: 0,
                      columnGap: 10,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>ID phòng:</span>{" "}
                    <Input readOnly defaultValue={MainStore.roomId} />
                  </div>
                  {range(0, MainStore.totalPlayers).map((idx, index) => (
                    <PlayerInfor
                      key={(MainStore.players[idx]?.id || "noname-") + index}
                      playerId={MainStore.players[idx]?.id}
                    />
                  ))}
                </>
              )}
              {MainStore.gameState !== GAME_STATES.WAITING && (
                <PlayerInfor playerId={MainStore.playingId} />
              )}

              {(MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) ||
                MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY)) && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: 0,
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      className={
                        MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY)
                          ? "fade-in-left"
                          : "fade-in-right"
                      }
                      style={{
                        display: "flex",
                        flexDirection: "row-reverse",
                        maxWidth: 60,
                        flexWrap: "wrap-reverse",
                        position: "relative",
                        top: -30,
                        alignSelf: "end",
                      }}
                    >
                      <div
                        style={{ width: 30, height: 30, position: "relative" }}
                      >
                        <Icon
                          symbol="money"
                          style={{
                            position: "absolute",
                            width: 50,
                            height: 50,
                            maxWidth: 50,
                          }}
                          width="50px"
                          height="50px"
                        />
                      </div>
                      {parseInt(MainStore.gameState.split("--")[1]) >= 2000 &&
                        parseInt(MainStore.gameState.split("--")[1]) < 3000 && (
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              position: "relative",
                            }}
                          >
                            <Icon
                              style={{
                                position: "absolute",
                                width: 50,
                                height: 50,
                                maxWidth: 50,
                                top: -16,
                                left: 30,
                              }}
                              width={"50px"}
                              height={"50px"}
                              symbol="money"
                            />
                          </div>
                        )}
                      {parseInt(MainStore.gameState.split("--")[1]) >= 3000 &&
                        range(
                          1,
                          Math.floor(
                            parseInt(MainStore.gameState.split("--")[1]) / 1000
                          ) > 25
                            ? 25
                            : Math.floor(
                                parseInt(MainStore.gameState.split("--")[1]) /
                                  1000
                              )
                        ).map((numb) => (
                          <div
                            key={numb}
                            style={{
                              width: 30,
                              height: 30,
                              position: "relative",
                            }}
                          >
                            <Icon
                              style={{
                                position: "absolute",
                                width: 50,
                                height: 50,
                                maxWidth: 50,
                                top:
                                  14 * ((numb % 2 !== 0 ? numb + 1 : numb) / 2),
                              }}
                              width={"50px"}
                              height={"50px"}
                              symbol="money"
                            />
                          </div>
                        ))}
                    </div>
                  </div>{" "}
                  {MainStore.gameState.split("--")[2] &&
                    MainStore.gameState.split("--")[2] !== "bank" && (
                      <PlayerInfor
                        playerId={MainStore.gameState.split("--")[2]}
                        rightSide
                      />
                    )}
                  {MainStore.gameState.split("--")[2] === "bank" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Icon symbol="bank" width={"120px"} height={"80px"} />
                      <div
                        style={{
                          fontWeight: "bold",
                          textAlign: "center",
                          textShadow: `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000`,
                          color: "white",
                          marginTop: 10,
                        }}
                      >
                        {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY)
                          ? "-"
                          : "+"}
                        {MainStore.gameState.split("--")[1]}$
                      </div>
                    </div>
                  )}
                </>
              )}
              {![
                GAME_STATES.INC_MONEY,
                GAME_STATES.DEC_MONEY,
                GAME_STATES.WAITING,
              ].includes(MainStore.gameState.split("--")[0]) && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    <Die value={MainStore.dice[0]} />
                    <Die value={MainStore.dice[1]} />
                    {MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY) && (
                      <div
                        style={{
                          padding: "10px 0",
                          color: "red",
                          position: "absolute",
                          bottom: -20,
                          left: "50%",
                          width: "160%",
                          transform: "translateX(-50%)",
                          textAlign: "center",
                          background:
                            "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8498249641653537) 10%, rgba(0,34,41,0.8498249641653537) 90%, rgba(0,212,255,0) 100%)",
                        }}
                      >
                        <span style={{ color: "white" }}>
                          Bạn cần thanh toán
                        </span>{" "}
                        <br />{" "}
                        <strong style={{ color: "red" }}>
                          {MainStore.priceNeedToPay &&
                            MainStore.priceNeedToPay
                              .toString()
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          $
                        </strong>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      rowGap: 5,
                    }}
                  >
                    {MainStore.players.map((player, index) => (
                      <div
                        key={player.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          position: "relative",
                        }}
                      >
                        {player.haveFreeCard && (
                          <Icon
                            style={{ position: "absolute", left: -20 }}
                            symbol="card"
                            width="20px"
                            height="20px"
                          />
                        )}
                        {player.broke && (
                          <Icon
                            style={{ position: "absolute", left: -3 }}
                            symbol="stop"
                            width="30px"
                            height="30px"
                          />
                        )}
                        {player.broke && (
                          <Popover
                            content={
                              <div style={{ color: COLORS[index] }}>
                                {MainStore.chat[player.id]
                                  ? MainStore.chat[player.id].split("--")[0]
                                  : ""}
                              </div>
                            }
                            open={
                              MainStore.chat[player.id] &&
                              moment(MainStore.chat[player.id].split("--")[1])
                                .add("5", "second")
                                .isAfter(moment())
                            }
                            key={
                              player.id +
                              BLOCKS[(player.position - 1) % 36]?.position +
                              (MainStore.chat[player.id] || "no-message")
                            }
                          >
                            <img
                              style={{
                                flex: "0 0 25px",
                                height: 25,
                                marginRight: 10,
                              }}
                              alt=""
                              src={AVATARS[index]}
                            />
                          </Popover>
                        )}
                        {!player.broke && (
                          <img
                            style={{
                              flex: "0 0 25px",
                              height: 25,
                              marginRight: 10,
                            }}
                            alt=""
                            src={AVATARS[index]}
                          />
                        )}
                        <div
                          style={{
                            textDecoration: player.broke
                              ? "line-through"
                              : undefined,
                            fontWeight: "bold",
                            color: "white",
                            textShadow: `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000`,
                          }}
                        >
                          {player.money}$
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <Modal
        centered
        closable={false}
        open={MainStore.gameState === "init"}
        footer={[
          <Button key="submit" onClick={handleOk}>
            {!MainStore.online && "Bắt đầu"}
            {MainStore.online && MainStore.isHost && "Tạo phòng"}
            {MainStore.online && !MainStore.isHost && "Tham gia"}
          </Button>,
        ]}
        maskClosable={false}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <p style={{ flex: "0 0 auto", marginRight: 10 }}>Chơi online:</p>
            <Switch value={MainStore.online} onChange={MainStore.setOnline} />
          </div>
          {MainStore.online && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <p style={{ flex: "0 0 auto", marginRight: 10 }}>
                Tạo phòng mới:
              </p>
              <Switch value={MainStore.isHost} onChange={MainStore.setHost} />
            </div>
          )}
        </div>
        {MainStore.online && (
          <>
            {!MainStore.isHost && (
              <div style={{ display: "flex", alignItems: "center" }}>
                <p style={{ flex: "0 0 auto", marginRight: 10 }}>
                  Nhập Id phòng:
                </p>
                <Input
                  onChange={(e) => MainStore.setRoomId(e.target.value)}
                  placeholder="Nhập Id phòng"
                />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center" }}>
              <p style={{ flex: "0 0 auto", marginRight: 10 }}>Nhập tên:</p>
              <Input
                value={MainStore.myName}
                onChange={(e) => MainStore.setMyName(e.target.value)}
                placeholder="Nhập tên của bạn"
              />
            </div>
          </>
        )}

        {!MainStore.online && (
          <>
            {range(0, MainStore.totalPlayers).map((numb) => (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 10,
                }}
                key={numb}
              >
                <img
                  style={{ flex: "0 0 40px", height: 40 }}
                  alt=""
                  src={AVATARS[numb]}
                />
                <Input
                  value={MainStore.players[numb]?.name}
                  onChange={(e) =>
                    MainStore.updatePlayerData(
                      MainStore.players[numb],
                      "name",
                      e.target.value
                    )
                  }
                />
                <div
                  style={{
                    flex: "0 0 20px",
                    height: 20,
                    borderRadius: "50%",
                    marginLeft: 10,
                    background: COLORS[numb],
                  }}
                ></div>
              </div>
            ))}
          </>
        )}
        {(!MainStore.online || (MainStore.online && MainStore.isHost)) && (
          <>
            <div style={{ display: "flex", alignItems: "center" }}>
              <p style={{ flex: "0 0 auto", marginRight: 10 }}>
                Số tiền ban đầu:
              </p>
              <InputNumber
                suffix="$"
                min={5000}
                value={MainStore.startMoney}
                onChange={MainStore.updateStartMoney}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <p style={{ flex: "0 0 auto", marginRight: 10 }}>
                Tổng số người chơi:
              </p>
              <InputNumber
                min={2}
                max={4}
                value={MainStore.totalPlayers}
                onChange={MainStore.updateTotalPlayers}
              />
            </div>
          </>
        )}
      </Modal>
      <Modal
        centered
        closable={false}
        open={MainStore.endGame}
        footer={[
          <Button
            key="submit"
            disabled={!MainStore.isHost}
            onClick={MainStore.resetGame}
          >
            {MainStore.isHost ? "Chơi lại" : "Xin chờ"}
          </Button>,
        ]}
        maskClosable={false}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ flex: "0 0 auto", marginRight: 10 }}>
              Người chiến thắng là :
            </p>
          </div>
          <PlayerInfor playerId={MainStore.players.find((p) => p.winner)?.id} />
          <div>
            {MainStore.players.find((p) => p.winner)?.name} đã thắng vì{" "}
            {MainStore.players.find((p) => p.winner)?.winReason ===
              "not-broke" && "là người chơi tồn tại cuối cùng"}
            {MainStore.players.find((p) => p.winner)?.winReason ===
              "four-public" && "sỡ hữu 4 ô công cộng"}
            {MainStore.players.find((p) => p.winner)?.winReason ===
              "three-monopoly" && "sỡ hữu 3 monopoly"}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default observer(Dashboard);
