import { observer } from "mobx-react-lite";
import React from "react";
import { AVATARS, COLORS, GAME_STATES } from "./constants";
import MainStore from "./MainStore";

const PlayerInfor = ({ playerId, rightSide }) => {
  const currentPlayerIndex = MainStore.players.findIndex(
    (p) => p.id === playerId
  );
  const currentPlayer = MainStore.players[currentPlayerIndex];

  return (
    <div className="information__player-infor">
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          color: "white",
          textShadow: `-1px -1px 0 ${COLORS[currentPlayerIndex]}, 1px -1px 0 ${COLORS[currentPlayerIndex]}, -1px 1px 0 ${COLORS[currentPlayerIndex]}, 1px 1px 0 ${COLORS[currentPlayerIndex]}`,
        }}
      >
        {currentPlayer.name}
      </div>
      <img
        style={{ flex: "0 0 80px", height: 40 }}
        alt=""
        src={AVATARS[currentPlayerIndex]}
      />
      <div
        style={{
          textAlign: "center",
          position: "relative",
          fontWeight: "bold",
          color: "white",
          textShadow: `-1px -1px 0 ${COLORS[currentPlayerIndex]}, 1px -1px 0 ${COLORS[currentPlayerIndex]}, -1px 1px 0 ${COLORS[currentPlayerIndex]}, 1px 1px 0 ${COLORS[currentPlayerIndex]}`,
        }}
      >
        {currentPlayer.money}$
        {(MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) ||
          MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY)) && (
          <div
            style={{ position: "absolute", top: 0 }}
            className="fade-out-top"
            key={MainStore.gameState}
          > 
            {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) && !rightSide ? "+" : ""}
            {MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) && rightSide ? "-" : ""}
            {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) && !rightSide ? "-" : ""}
            {MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) && rightSide ? "+" : ""}
            {MainStore.gameState.split("--")[1]}$
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(PlayerInfor);
