import { observer } from "mobx-react-lite";
import React from "react";
import Icon from "../../components/Icon";
import { COLORS, GAME_STATES, TOTAL_AVATARS } from "./constants";
import MainStore from "./MainStore";
import { Button } from "antd";

const PlayerInfor = ({ playerId, rightSide, updateAvatar }) => {
  const currentPlayerIndex = MainStore.players.findIndex(
    (p) => p.id === playerId
  );
  const currentPlayer = MainStore.players[currentPlayerIndex] || {};
  const color = COLORS[currentPlayerIndex] || "black";
  const avatar = currentPlayer.avatar || 1;

  return (
    <div className="information__player-infor">
      {updateAvatar && (
        <>
          <Button
            ghost
            size="middle"
            shape="circle"
            style={{
              marginRight: 5,
              position: "absolute",
              top: "50%",
              left: -25,
            }}
            onClick={() => {
              MainStore.updatePlayerData(
                currentPlayer,
                "avatar",
                avatar - 1 < 1 ? TOTAL_AVATARS : avatar - 1
              );
              MainStore.sendDataToChannel(["players"]);
            }}
          >
            ◂
          </Button>
          <Button
            ghost
            size="middle"
            shape="circle"
            style={{
              marginRight: 5,
              position: "absolute",
              top: "50%",
              right: -25,
            }}
            onClick={() => {
              MainStore.updatePlayerData(
                currentPlayer,
                "avatar",
                avatar + 1 > TOTAL_AVATARS ? 1 : avatar + 1
              );
              MainStore.sendDataToChannel(["players"]);
            }}
          >
            ▸
          </Button>
        </>
      )}

      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          color: "white",
          textShadow: `-1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}, 1px 1px 0 ${color}`,
        }}
      >
        {currentPlayer.name || "Đang chờ..."}
      </div>
      <Icon
        style={{ flex: "0 0 80px", color: color, margin: "10px 0" }}
        symbol={currentPlayerIndex !== -1 ?"avatar" + (currentPlayer.avatar || 1) : "placeholder-player"}
        width="80px"
        height="40px"
      />

      <div
        style={{
          textAlign: "center",
          position: "relative",
          fontWeight: "bold",
          color: "white",
          textShadow: `-1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}, 1px 1px 0 ${color}`,
        }}
      >
        {currentPlayer.money !== undefined
          ? currentPlayer.money
          : MainStore.startMoney}
        $
        {(MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) ||
          MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) ||
          MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY + "_inc")) && (
          <div
            style={{ position: "absolute", top: 0 }}
            className="fade-out-top"
            key={MainStore.gameState}
          >
            {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) && !rightSide
              ? "+"
              : ""}
            {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) && rightSide
              ? "-"
              : ""}
            {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) && !rightSide
              ? "-"
              : ""}
            {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) && rightSide
              ? "+"
              : ""}
            {MainStore.gameState.split("--")[1]}$
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(PlayerInfor);
