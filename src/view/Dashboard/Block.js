import { range } from "lodash";
import { observer } from "mobx-react-lite";
import React, { Fragment } from "react";
import Icon from "../../components/Icon";
import { BLOCKS, COLORS, GAME_STATES } from "./constants";
import MainStore from "./MainStore";
import fettiSVG from "../../asset/img/confetti.svg";
import lightningSVG from "../../asset/img/lightning.svg";
import { Popover, Table } from "antd";

const Block = ({ block, idx, active }) => {
  const price = MainStore.getPrice(block);
  const color =
    COLORS[
      MainStore.getPlayerIndexById(MainStore.ownedBlocks[block?.name]?.playerId)
    ];

  const checkNeedToHide = () => {
    if (MainStore.loans[MainStore.myName]?.status === "request") return true;

    if (MainStore.gameState.startsWith(GAME_STATES.ALMOST_END) && !isNeedActive)
      return true;

    if (
      MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY) &&
      MainStore.gameState.split("--")[2] !==
        MainStore.ownedBlocks[block.name]?.playerId
    ) {
      return true;
    }
    if (MainStore.gameState.startsWith(GAME_STATES.CHOOSE_BUILDING)) {
      if (
        MainStore.gameState.split("--")[1] === "all-building" &&
        (block.type === "public" || block.type === "property")
      )
        return false;
      if (!MainStore.ownedBlocks[block.name]) return true;
      if (MainStore.gameState.split("--")[1] === "my-building") {
        if (MainStore.ownedBlocks[block.name].playerId !== MainStore.playingId)
          return true;
      }

      if (MainStore.gameState.split("--")[1] === "my-building-lower-5") {
        if (
          MainStore.ownedBlocks[block.name].playerId !== MainStore.playingId ||
          (MainStore.ownedBlocks[block.name].playerId === MainStore.playingId &&
            (MainStore.ownedBlocks[block.name].level >= 5 ||
              block.type === "public"))
        )
          return true;
      }

      if (MainStore.gameState.split("--")[1] === "other-building") {
        if (MainStore.ownedBlocks[block.name].playerId === MainStore.playingId)
          return true;
      }
    }

    return false;
  };

  const isNeedActive =
    MainStore.gameState.startsWith(GAME_STATES.ALMOST_END) &&
    JSON.parse(MainStore.gameState.split("--")[3]).includes(
      block.row || block.type
    );
  const showPropertyInfor = false
  const Wrapper = showPropertyInfor ? Popover : Fragment;
  let wrapperProps = {};
  if (showPropertyInfor) {
    wrapperProps.trigger = "click";
    wrapperProps.title = "Thông tin ô " + block.name;
    wrapperProps.getPopupContainer = () =>
      document.querySelector(".container-page");
    wrapperProps.content =
      block.type === "property" ? (
        <Table
          size="small"
          columns={[
            {
              title: "",
              dataIndex: "type",
            },
            {
              title: "Tiền mua",
              dataIndex: "buyPrice",
              align: "right",
            },
            {
              title: "Tiền phải trả ",
              dataIndex: "payPrice",
              align: "right",
            },
          ]}
          dataSource={range(1, 7).map((lv) => ({
            type:
              lv === 1 ? "Đất" : lv === 6 ? "Biệt thự" : "Nhà cấp " + (lv - 1),
            buyPrice: block?.price[lv - 1] + "$",
            payPrice: MainStore.getPrice(block, lv, true) + "$",
          }))}
          pagination={false}
        />
      ) : null;
  }
  return (
    <Wrapper {...wrapperProps}>
      <div
        style={{
          backgroundColor:
            active || isNeedActive ? "rgb(18, 48, 77)" : undefined,
          ...(isNeedActive && !MainStore.ownedBlocks[block.name]
            ? {
                borderColor:
                  COLORS[MainStore.getPlayerIndexById(MainStore.playingId)],
              }
            : {}),
          boxShadow: active
            ? `0 0 2px #fff, 0 0 20px ${
                COLORS[MainStore.getPlayerIndexById(MainStore.playingId)]
              }, 0 0 30px ${
                COLORS[MainStore.getPlayerIndexById(MainStore.playingId)]
              },
    0 0 40px ${COLORS[MainStore.getPlayerIndexById(MainStore.playingId)]}`
            : undefined,
          transform: active ? "scale(1.1)" : "scale(1)",
          gridArea: "i" + (idx + 1).toString(),
          flexDirection: ["top", "bottom"].includes(block.position)
            ? "column"
            : block.position === "left"
            ? "row"
            : "row-reverse",
          opacity: checkNeedToHide() && !active ? 0.2 : 1,
          outline:
            MainStore.sellingProperty === block.name ||
            ((MainStore.gameState.startsWith(GAME_STATES.CHOOSEN_BUILDING) ||
              MainStore.gameState.startsWith(GAME_STATES.DOWN_GRADE_BUILDING) ||
              MainStore.gameState.startsWith(
                GAME_STATES.LOST_ELECTRIC_BUILDING
              )) &&
              MainStore.gameState.split("--")[1] === block.name)
              ? "4px solid red"
              : undefined,
          zIndex:
            MainStore.sellingProperty === block.name ||
            MainStore.gameState.split("--")[1] === block.name ||
            active
              ? 999
              : undefined,
        }}
        className={`block block--${block.type} ${
          isNeedActive && !MainStore.ownedBlocks[block.name] ? "glow-anim" : ""
        }`}
        id={`block-${idx}`}
        onClick={() =>
          MainStore.handleChooseBlock(block, checkNeedToHide(), true)
        }
      >
        <div
          className="diag"
          style={{
            backgroundImage: MainStore.ownedBlocks[block.name]?.lostElectricity
              ? `url(${lightningSVG})`
              : "none",
            backgroundColor: MainStore.ownedBlocks[block.name]?.lostElectricity
              ? "rgb(0 0 0 / 60%)"
              : undefined,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
            width: ["top", "bottom"].includes(block.position)
              ? "100%"
              : undefined,
            height: ["left", "right"].includes(block.position)
              ? "100%"
              : undefined,
          }}
        >
          {MainStore.festivalProperty.includes(block.name) && (
            <div
              className="diag"
              style={{
                backgroundImage: `url(${fettiSVG})`,
                position: "absolute",
                opacity: 0.6,
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
              }}
            ></div>
          )}
          {block.type === "plane" ||
          block.type === "jail" ||
          block.type === "jail-visit" ||
          block.type === "start" ||
          block.type === "chance" ? (
            <Icon
              style={{ margin: "auto" }}
              symbol={block.type}
              width={window.innerWidth > 950 ? "40px" : "30px"}
              height={window.innerWidth > 950 ? "40px" : "30px"}
            />
          ) : (
            <span
              style={{
                minHeight: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: window.innerWidth > 950 ? 15 : 9,
              }}
            >
              {block?.name}
            </span>
          )}

          {(block.type === "jail" ||
            block.type === "jail-visit" ||
            block.type === "start") && (
            <span
              style={{
                position: "absolute",
                bottom: window.innerWidth > 950 ? 5 : 2,
                fontSize: price ? 13 : 11,
                width: "100%",
                animationDelay: "0.5s",
              }}
            >
              {block.name}
            </span>
          )}

          {price && (
            <div
              key={price + MainStore.ownedBlocks[block?.name].playerId}
              style={{
                position: "absolute",
                bottom: window.innerWidth > 950 ? 5 : 2,
                fontSize: price ? (window.innerWidth > 950 ? 15 : 11) : 11,
                width: "100%",
                animationDelay: "0.5s",
                "--playerColor": color,
              }}
              className="fade-in-top"
            >
              <span
                style={{
                  opacity: MainStore.ownedBlocks[block.name]?.lostElectricity
                    ? 0.5
                    : 1,
                }}
                className={
                  !MainStore.ownedBlocks[block.name]?.lostElectricity
                    ? "glow"
                    : ""
                }
              >
                {price + "$"}
              </span>
            </div>
          )}

          {BLOCKS[MainStore.flightDestination] && block.type === "plane" && (
            <span
              key={BLOCKS[MainStore.flightDestination]?.name}
              style={{
                position: "absolute",
                bottom: window.innerWidth > 950 ? 5 : 2,
                fontSize: window.innerWidth > 950 ? 11 : 9,
                width: "100%",
                animationDelay: "1s",
              }}
              className="fade-in-top"
            >
              {`(${BLOCKS[MainStore.flightDestination].name})`}
            </span>
          )}
        </div>
        {["property", "public"].includes(block?.type) && (
          <div
            style={{
              flex: "0 0 10px",
              width: "100%",
              maxWidth: ["left", "right"].includes(block.position)
                ? "10px"
                : undefined,
              height: ["left", "right"].includes(block.position)
                ? "100%"
                : "10px",
              display: "flex",
              flexDirection: ["left", "right"].includes(block.position)
                ? "column"
                : "row",
              alignItems: "flex-end",
              gap: 5,
              background:
                block.type === "public" && MainStore.ownedBlocks[block?.name]
                  ? color
                  : block?.row,
              opacity: 0.7,
              // borderTop: block.position === "top" ? "1px solid black" : undefined,
              // borderBottom:
              //   block.position === "bottom" ? "1px solid black" : undefined,
              // borderLeft:
              //   block.position === "left" ? "1px solid black" : undefined,
              // borderRight:
              //   block.position === "right" ? "1px solid black" : undefined,
              // borderColor: 'rgba(255, 255, 255, 0.541)',
              position: "relative",
              order: block.position === "bottom" ? "-1" : "initial",
            }}
          >
            {MainStore.ownedBlocks[block?.name] && block.type !== "public" && (
              <>
                {MainStore.ownedBlocks[block?.name].level === 1 && (
                  <div
                    className="fade-in-top"
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      display: "flex",
                    }}
                  >
                    <Icon
                      symbol="flag"
                      style={{
                        color,
                        transform: `rotate(${
                          ["bottom", "left", "", "right", "top"].indexOf(
                            block.position
                          ) * 90
                        }deg)`,
                        margin: "auto",
                        flex: "0 0 10px",
                        position: "relative",
                      }}
                      width="10px"
                      height="10px"
                    />
                  </div>
                )}
                {MainStore.ownedBlocks[block?.name].level > 1 &&
                  MainStore.ownedBlocks[block?.name].level <= 5 && (
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        display: "flex",
                        flexDirection: ["left", "right"].includes(
                          block.position
                        )
                          ? "column"
                          : "row",
                        justifyContent: "center",
                      }}
                    >
                      {range(MainStore.ownedBlocks[block?.name].level - 1).map(
                        (numb) => (
                          <Icon
                            key={numb}
                            className="fade-in-top"
                            symbol="bulding"
                            style={{
                              color,
                              transform: `rotate(${
                                ["bottom", "left", "", "right", "top"].indexOf(
                                  block.position
                                ) * 90
                              }deg)`,
                              flex: "0 0 10px",
                              position: "relative",
                            }}
                            width="10px"
                            height="10px"
                          />
                        )
                      )}
                    </div>
                  )}
                {MainStore.ownedBlocks[block?.name].level === 6 && (
                  <div
                    className="diag fade-in-top"
                    style={{
                      border: "1px solid black",
                      width: ["top", "bottom"].includes(block?.position)
                        ? "80%"
                        : 10,
                      height: ["left", "right"].includes(block?.position)
                        ? "80%"
                        : 10,
                      margin: "auto",
                      backgroundColor: color,
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default observer(Block);
