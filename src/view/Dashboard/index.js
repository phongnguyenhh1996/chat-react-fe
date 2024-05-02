import React from "react";
import { random, range } from "lodash";
import { Button, Modal, InputNumber, Input } from "antd";
import { observer } from "mobx-react-lite";
import MainStore from "./MainStore";
import { AVATARS, BLOCKS, COLORS, GAME_STATES } from "./constants";
import { delay, getBlockPositionStyle } from "./utils";
import Die from "../../components/Dice";
import moneySVG from "../../asset/img/money.svg";
import bankSVG from "../../asset/img/bank.svg";
import Block from "./Block";
import PlayerInfor from "./PlayerInfor";
import Icon from "../../components/Icon";

const Dashboard = () => {
  const handleOk = () => {
    MainStore.updateGameState(GAME_STATES.ROLL_DICE);
    MainStore.updatePlayingId(
      MainStore.players[random(0, MainStore.players.length - 1)].id
    );
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
    await delay(2000);
    MainStore.updatePlayerData(
      currentPlayer,
      "position",
      getJailPosition(currentPlayer)
    );
    MainStore.updatePlayerData(currentPlayer, "onJail", 1);
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
  };

  const nextPlayerTurn = async (forceSwitch) => {
    MainStore.updateGameState(GAME_STATES.SWITCH_TURN);
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
        await delay(1000);
        MainStore.updateGameState(GAME_STATES.BUYING);
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
            }
          } else {
            MainStore.updateGameState(GAME_STATES.RECEIVER_ON_JAIL);
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
            await delay(2000);
            nextPlayerTurn();
          } else {
            MainStore.updateBuyingProperty(block.name);
            await delay(1000);
            MainStore.updateGameState(GAME_STATES.UPDATING);
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
          await delay(2000);
          movingPlayer(() => {}, position);
        },
        async () => {
          const allOwnedBlockKeys = Object.keys(MainStore.ownedBlocks).filter(
            (key) =>
              MainStore.ownedBlocks[key].playerId === currentPlayer.id &&
              MainStore.ownedBlocks[key].level > 1 &&
              MainStore.ownedBlocks[key].level < 6
          );
          if (allOwnedBlockKeys.length === 0 || currentPlayer.money <= 5000) {
            MainStore.updateGameState(
              GAME_STATES.DOWN_GRADE_BUILDING + "--no-property"
            );
            await delay(2000);
            nextPlayerTurn();
            return;
          }
          const randomKey =
            allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
          MainStore.updateGameState(
            GAME_STATES.DOWN_GRADE_BUILDING + "--" + randomKey
          );
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
          await delay(2000);
          nextPlayerTurn();
        },
        async () => {
          const allOwnedBlockKeys = Object.keys(MainStore.ownedBlocks).filter(
            (key) => MainStore.ownedBlocks[key].playerId === currentPlayer.id
          );
          MainStore.updateGameState(GAME_STATES.LOST_ELECTRIC_BUILDING);
          await delay(2000);
          if (allOwnedBlockKeys.length > 0) {
            const randomKey =
              allOwnedBlockKeys[random(0, allOwnedBlockKeys.length - 1)];
            MainStore.updateOwnedBlockElectricity(randomKey, 1);
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
          await delay(2000);
          nextPlayerTurn();
        },
        async () => {
          MainStore.updateGameState(GAME_STATES.FREE_OUT_FAIL_CARD);
          await delay(2000);
          MainStore.updatePlayerData(currentPlayer, "haveFreeCard", true);
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
          await delay(2000);
          nextPlayerTurn();
          return;
        },
        async () => {
          const allOwnedBlockKeys = Object.keys(MainStore.ownedBlocks).filter(
            (key) => MainStore.ownedBlocks[key].playerId === currentPlayer.id
          );
          MainStore.updateGameState(GAME_STATES.RANDOM_TRAVELING);
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
          } else {
            MainStore.updateGameState(
              GAME_STATES.NO_BLOCK_TO_CHOOSE_FESTIVAL_BUILDING
            );
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
      await delay(2000);
      movingPlayer(MainStore.randomFlightDestination, position);
      return;
    }

    nextPlayerTurn();
  };

  const checkEndGame = () => {
    if (MainStore.players.filter((p) => !p.broke).length < 2) {
      const playerNotBroke = MainStore.players.find((p) => !p.broke);
      console.log(playerNotBroke);
      MainStore.updatePlayerData(playerNotBroke, "winner", true);
      MainStore.updatePlayerData(playerNotBroke, "winReason", "not-broke");
      MainStore.setEndGame(true);
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
        return;
      }
    });
  };

  const movingPlayer = async (callback, planeDestinationPostion) => {
    if (currentPlayer.onJail > 0) {
      if (MainStore.dice[0] === MainStore.dice[1]) {
        MainStore.updateGameState(GAME_STATES.GOING_OUT_JAIL);
        MainStore.updatePlayerData(currentPlayer, "onJail", 0);
        await delay(2000);
        nextPlayerTurn(true);
      } else {
        if (currentPlayer.haveFreeCard) {
          MainStore.updateGameState(GAME_STATES.USE_FREE_CARD);
          MainStore.updatePlayerData(currentPlayer, "haveFreeCard", false);
          MainStore.updatePlayerData(currentPlayer, "onJail", 0);
          await delay(2000);
          nextPlayerTurn(true);
          return;
        }
        MainStore.updatePlayerData(
          currentPlayer,
          "onJail",
          currentPlayer.onJail + 1
        );
        MainStore.updateGameState(GAME_STATES.DOUBLE_TO_OUT);
        await delay(2000);
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
          await delay(2000);
          nextPlayerTurn(true);
        } else {
          nextPlayerTurn(true);
        }
      }
      return;
    }
    const newPosition = planeDestinationPostion
      ? planeDestinationPostion
      : currentPlayer.position + MainStore.dice[0] + MainStore.dice[1];
    if (!planeDestinationPostion) {
      MainStore.updateGameState(GAME_STATES.MOVING);
      await delay(2000);
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
        }
      },
      planeDestinationPostion ? 100 : 200
    );
  };

  const rollDice = async () => {
    if (MainStore.gameState !== GAME_STATES.ROLL_DICE) return;
    MainStore.updateGameState(GAME_STATES.ROLLING_DICE);
    const roll = setInterval(() => MainStore.randomDice(), 100);
    await delay(2000);
    clearInterval(roll);
    movingPlayer();
  };

  const buyingProperty = BLOCKS.find(
    (block) => block.name === MainStore.buyingProperty
  );

  const updatingPropertyInfo = MainStore.ownedBlocks[buyingProperty?.name];

  const handleNotEnoughMoney = async (player, price) => {
    MainStore.updateGameState(GAME_STATES.NEED_MONEY + "----" + player.id);
    MainStore.setPriceNeedToPay(price);
    const playerStillHaveMoney = await MainStore.ensureMoneyIsEnough(
      MainStore.checkMoney,
      player.id,
      price
    );
    if (!playerStillHaveMoney) {
      price = player.money;
      MainStore.updatePlayerData(player, "broke", true);
      MainStore.updatePlayerData(player, "money", 0);
      MainStore.updatePlayerData(player, "position", 1);
      Object.keys(MainStore.ownedBlocks).forEach((key) => {
        if (MainStore.ownedBlocks[key].playerId === player.id) {
          MainStore.deleteOwnedBlock(key);
        }
      });
      checkEndGame();
    }
    await delay(1000);
    MainStore.resetSellingState();
    return price;
  };

  const buyProperty = async () => {
    const price = buyingProperty.price[updatingPropertyInfo?.level || 0];
    if (currentPlayer.money - price < 0) {
      await handleNotEnoughMoney(currentPlayer, price);
    }
    MainStore.updatePlayerData(
      currentPlayer,
      "money",
      currentPlayer.money - price
    );
    MainStore.updateOwnedBlocks(buyingProperty.name, price);
    MainStore.updateGameState(GAME_STATES.DEC_MONEY + "--" + price + "--bank");
    await delay(2000);
    checkEndGame();
    nextPlayerTurn();
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
    await delay(1000);
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
                "Chạm để tung xúc xắc"}
              {MainStore.gameState === GAME_STATES.ROLL_DICE &&
                MainStore.samePlayerRolling > 1 &&
                `Chạm để tung xúc xắc. Bạn được tung lần ${MainStore.samePlayerRolling} do xúc xắc ra đôi`}
              {(MainStore.gameState === GAME_STATES.BUYING ||
                MainStore.gameState === GAME_STATES.UPDATING) &&
                buyingProperty && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    {MainStore.gameState === GAME_STATES.BUYING && (
                      <div>
                        Bạn có muốn mua {buyingProperty.name} với giá là{" "}
                        {buyingProperty.price[0]}$ ?
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
                MainStore.sellingProperty && (
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
                    Bạn đã mất {MainStore.gameState.split("--")[1]}$ khi đi vào
                    ô này
                  </div>
                )}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[2] === "bank" &&
                !MainStore.gameState.split("--")[3] && (
                  <div>
                    Bạn đã thanh toán {MainStore.gameState.split("--")[1]}$
                  </div>
                )}
              {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) &&
                MainStore.gameState.split("--")[3] === "new-round" &&
                "Bạn nhận được 2000$ vì qua vòng mới"}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[3] === "pay-out-jail" &&
                "Bạn phải trả 500$ để ra tù"}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[3] === "fix-electric" &&
                "Bạn mất 200$ phí sửa điện"}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[3] === "tax" &&
                `Bạn phải nộp thuế ${MainStore.gameState.split("--")[1]}$`}
              {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
                MainStore.gameState.split("--")[3] === "jail-visit" &&
                `Đi thăm tù hết ${MainStore.gameState.split("--")[1]}$`}
              {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) &&
                MainStore.gameState.split("--")[3] === "gift" &&
                `Bạn nhận được ${
                  MainStore.gameState.split("--")[1]
                }$ quà sinh nhật`}
              {MainStore.gameState === GAME_STATES.GOING_JAIL &&
                "Bạn bị đưa vào tù"}
              {MainStore.gameState === GAME_STATES.GOING_OUT_JAIL &&
                "Bạn được ra tù do xúc xắc ra đôi"}
              {MainStore.gameState === GAME_STATES.NO_BONUS &&
                "Bạn không có tiền thưởng vòng mới khi bước vào ô này"}
              {MainStore.gameState === GAME_STATES.DOUBLE_TO_OUT &&
                `Bạn cần xúc xắc ra đôi để ra tù!`}
              {MainStore.gameState === GAME_STATES.RECEIVER_ON_JAIL &&
                `Bạn không mất tiền do chủ nhà đang ở tù`}
              {MainStore.gameState === GAME_STATES.MAX_LEVEL_PROPERTY &&
                `Không thể nâng cấp thêm do ô này đã đạt cấp độ tối đa`}
              {MainStore.gameState.startsWith(GAME_STATES.FLIGHT) &&
                `Bạn được bay tới ô ${
                  BLOCKS[MainStore.gameState.split("--")[1]].name
                }`}
              {MainStore.gameState ===
                GAME_STATES.NOT_ENOUGH_MONEY_BUYING_PROPERTY &&
                buyingProperty &&
                `Mua ô này cần có ${
                  buyingProperty.price[updatingPropertyInfo?.level || 0]
                }. Bạn không đủ tiền`}
              {MainStore.gameState ===
                GAME_STATES.NOT_ENOUGH_MONEY_UPDATING_PROPERTY &&
                buyingProperty &&
                `Nâng cấp ô này cần có ${
                  buyingProperty.price[(updatingPropertyInfo?.level || 1) - 1]
                } Bạn không đủ tiền`}
              {MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY) &&
                !MainStore.sellingProperty &&
                "Chọn ô đất bạn muốn bán"}
              {MainStore.gameState.startsWith(GAME_STATES.GOING_BACK) &&
                `Bạn bị đi lùi ${MainStore.gameState.split("--")[1]} bước`}
              {MainStore.gameState.startsWith(
                GAME_STATES.DOWN_GRADE_BUILDING
              ) &&
                MainStore.gameState.split("--")[1] !== "no-property" && (
                  <div>
                    Người chơi hiện tại nếu trên 5000$ bị buộc bán 1 căn nhà.
                    <br />
                    {`Bạn bị buộc bán 1 căn nhà ở ${
                      MainStore.gameState.split("--")[1]
                    }`}
                  </div>
                )}
              {MainStore.gameState.startsWith(
                GAME_STATES.DOWN_GRADE_BUILDING
              ) &&
                MainStore.gameState.split("--")[1] === "no-property" && (
                  <div>
                    Người chơi hiện tại nếu trên 5000$ bị buộc bán 1 căn nhà.
                    <br />
                    Bạn chưa thỏa mãn điều kiện
                  </div>
                )}
              {MainStore.gameState.startsWith(
                GAME_STATES.LOST_ELECTRIC_BUILDING
              ) && "Một ô ngẫu nhiên của bạn sẽ bị cắt điện"}
              {MainStore.gameState === GAME_STATES.CURRENT_LOST_ELECTRIC &&
                "Bạn không mất tiền vì ô hiện tại đang mất điện"}
              {MainStore.gameState === GAME_STATES.FREE_OUT_FAIL_CARD &&
                "Bạn được tặng thẻ ra tù miễn phí"}
              {MainStore.gameState === GAME_STATES.USE_FREE_CARD &&
                "Đã sử dụng thẻ ra tù"}
              {MainStore.gameState === GAME_STATES.RANDOM_TRAVELING &&
                "Đi tới 1 ô của bạn ngẫu nhiên hoặc được tặng 500$ đi du lịch"}
              {MainStore.gameState.startsWith(
                GAME_STATES.FIXING_ELECTRIC_BUILDING
              ) && `Ô ${MainStore.gameState.split("--")[1]} đang được sửa điện`}
              {MainStore.gameState === GAME_STATES.CHOOSE_FESTIVAL_BUILDING &&
                "Vui lòng chọn một ô để tổ chức lễ hội"}
              {MainStore.gameState ===
                GAME_STATES.NO_BLOCK_TO_CHOOSE_FESTIVAL_BUILDING &&
                "Được chọn ô tổ chức lễ hội nhưng bạn chưa có ô nào"}
            </div>
            <div className="information__row">
              <PlayerInfor playerId={MainStore.playingId} />
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
                        <img
                          style={{
                            position: "absolute",
                            width: 50,
                            height: 50,
                            maxWidth: 50,
                          }}
                          width={50}
                          height={50}
                          src={moneySVG}
                          alt=""
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
                            <img
                              style={{
                                position: "absolute",
                                width: 50,
                                height: 50,
                                maxWidth: 50,
                                top: -16,
                                left: 30,
                              }}
                              width={50}
                              height={50}
                              src={moneySVG}
                              alt=""
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
                            <img
                              style={{
                                position: "absolute",
                                width: 50,
                                height: 50,
                                maxWidth: 50,
                                top:
                                  14 * ((numb % 2 !== 0 ? numb + 1 : numb) / 2),
                              }}
                              width={50}
                              height={50}
                              src={moneySVG}
                              alt=""
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
                      <img src={bankSVG} alt="" width={120} height={80} />
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
              {![GAME_STATES.INC_MONEY, GAME_STATES.DEC_MONEY].includes(
                MainStore.gameState.split("--")[0]
              ) && (
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
                        <img
                          style={{
                            flex: "0 0 25px",
                            height: 25,
                            marginRight: 10,
                          }}
                          alt=""
                          src={AVATARS[index]}
                        />
                        <div
                          style={{
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
            Bắt đầu
          </Button>,
        ]}
        maskClosable={false}
      >
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

        {range(0, MainStore.totalPlayers).map((numb) => (
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 10 }}
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

        <div style={{ display: "flex", alignItems: "center" }}>
          <p style={{ flex: "0 0 auto", marginRight: 10 }}>Số tiền ban đầu:</p>
          <InputNumber
            suffix="$"
            min={5000}
            value={MainStore.startMoney}
            onChange={MainStore.updateStartMoney}
          />
        </div>
      </Modal>
      <Modal
        centered
        closable={false}
        open={MainStore.endGame}
        footer={[
          <Button key="submit" onClick={MainStore.resetGame}>
            Chơi lại
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
