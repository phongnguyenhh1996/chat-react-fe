import { observer } from "mobx-react-lite";
import React from "react";
import Icon from "../../components/Icon";
import { AVATARS, COLORS, GAME_STATES } from "./constants";
import MainStore from "./MainStore";

const PlayerInfor = ({ playerId, rightSide }) => {
  const currentPlayerIndex = MainStore.players.findIndex(
    (p) => p.id === playerId
  );
  const currentPlayer = MainStore.players[currentPlayerIndex] || {};
  const color = COLORS[currentPlayerIndex] || "black";

  return (
    <div className="information__player-infor">
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
      {AVATARS[currentPlayerIndex] ? (
        <img
          style={{ flex: "0 0 80px", height: 40 }}
          alt=""
          src={AVATARS[currentPlayerIndex]}
        />
      ) : (
        <Icon
          style={{ flex: "0 0 80px" }}
          symbol="placeholder-player"
          width="80px"
          height="40px"
        />
      )}

      <div
        style={{
          textAlign: "center",
          position: "relative",
          fontWeight: "bold",
          color: "white",
          textShadow: `-1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}, 1px 1px 0 ${color}`,
        }}
      >
        {currentPlayer.money || MainStore.startMoney}$
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
