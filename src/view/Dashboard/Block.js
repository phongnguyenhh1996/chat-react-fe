import { range } from "lodash";
import { observer } from "mobx-react-lite";
import React from "react";
import Icon from "../../components/Icon";
import { BLOCKS, COLORS } from "./constants";
import MainStore from "./MainStore";

const Block = ({ block, idx }) => {
  console.log(MainStore.flightDestination);
  const price = MainStore.getPrice(
    block.price,
    MainStore.ownedBlocks[block.name]?.level
  );
  return (
    <div
      style={{
        gridArea: "i" + (idx + 1).toString(),
        flexDirection: ["top", "bottom"].includes(block.position)
          ? "column"
          : block.position === "left"
          ? "row"
          : "row-reverse",
      }}
      className="block"
    >
      <div
        style={{
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
          // background: MainStore.ownedBlocks[block?.name]
          //   ? COLORS[
          //       MainStore.getPlayerIndexById(
          //         MainStore.ownedBlocks[block?.name].playerId
          //       )
          //     ]
          //   : "transparent",
          // color: MainStore.ownedBlocks[block?.name] ? "white" : "black",
        }}
      >
        {block.type === "plane" || block.type === "jail" || block.type === "jail-visit" || block.type === "start"? (
          <Icon style={{margin: "auto"}} symbol={block.type} width="40px" height="40px" />
        ) : (
          <span
            style={{
              minHeight: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {block?.name}
          </span>
        )}

        {(block.type === "jail" || block.type === "jail-visit" || block.type === "start") && <span
            style={{
              position: "absolute",
              bottom: window.innerWidth > 950 ? 5 : 2,
              fontSize: price ? 13 : 11,
              width: "100%",
              animationDelay: "0.5s",
            }}
          >
            {block.name}
          </span>}

        {price && (
          <span
            key={price}
            style={{
              position: "absolute",
              bottom: window.innerWidth > 950 ? 5 : 2,
              fontSize: price ? 13 : 11,
              width: "100%",
              animationDelay: "0.5s",
              color:
                COLORS[
                  MainStore.getPlayerIndexById(
                    MainStore.ownedBlocks[block?.name].playerId
                  )
                ],
            }}
            className="fade-in-top"
          >
            {price + "$"}
          </span>
        )}

        {BLOCKS[MainStore.flightDestination] && block.type === "plane" && (
          <span
            key={BLOCKS[MainStore.flightDestination]?.name}
            style={{
              position: "absolute",
              bottom: window.innerWidth > 950 ? 5 : 2,
              fontSize: price ? 13 : 11,
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
            flex: "0 0 15px",
            width: "100%",
            maxWidth: ["left", "right"].includes(block.position)
              ? "15px"
              : undefined,
            height: ["left", "right"].includes(block.position)
              ? "100%"
              : "15px",
            display: "flex",
            flexDirection: ["left", "right"].includes(block.position)
              ? "column"
              : "row",
            alignItems: "flex-end",
            gap: 5,
            background:
              block.type === "public" && MainStore.ownedBlocks[block?.name]
                ? COLORS[
                    MainStore.getPlayerIndexById(
                      MainStore.ownedBlocks[block?.name].playerId
                    )
                  ]
                : block?.row,
            borderTop: block.position === "top" ? "2px solid black" : undefined,
            borderBottom:
              block.position === "bottom" ? "2px solid black" : undefined,
            borderLeft:
              block.position === "left" ? "2px solid black" : undefined,
            borderRight:
              block.position === "right" ? "2px solid black" : undefined,
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
                      color:
                        COLORS[
                          MainStore.getPlayerIndexById(
                            MainStore.ownedBlocks[block?.name].playerId
                          )
                        ],
                      transform: `rotate(${
                        ["bottom", "left", "", "right", "top"].indexOf(
                          block.position
                        ) * 90
                      }deg)`,
                      margin: "auto",
                      flex: "0 0 15px",

                      position: "relative",
                    }}
                    width="15px"
                    height="15px"
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
                      flexDirection: ["left", "right"].includes(block.position)
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
                            color:
                              COLORS[
                                MainStore.getPlayerIndexById(
                                  MainStore.ownedBlocks[block?.name].playerId
                                )
                              ],
                            transform: `rotate(${
                              ["bottom", "left", "", "right", "top"].indexOf(
                                block.position
                              ) * 90
                            }deg)`,
                            flex: "0 0 15px",
                            position: "relative",
                          }}
                          width="15px"
                          height="15px"
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
                      ? 60
                      : 10,
                    height: ["left", "right"].includes(block?.position)
                      ? 60
                      : 10,
                    margin: "auto",
                    backgroundColor:
                      COLORS[
                        MainStore.getPlayerIndexById(
                          MainStore.ownedBlocks[block?.name].playerId
                        )
                      ],
                  }}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default observer(Block);
