import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { debounce, get, pick, random, range } from "lodash";
import {
  Button,
  Modal,
  InputNumber,
  Input,
  Switch,
  Popover,
  Dropdown,
  message,
  Popconfirm,
  Table,
} from "antd";
import { observer } from "mobx-react-lite";
import MainStore, { SYNC_KEY } from "./MainStore";
import {
  AVATARS,
  BLOCKS,
  CHOOSE_BUILDING_ACTIONS,
  COLORS,
  GAME_STATES,
  MEME,
  SOUND,
} from "./constants";
import { delay, getBlockPositionStyle } from "./utils";
import Die from "../../components/Dice";
import Block from "./Block";
import PlayerInfor from "./PlayerInfor";
import Icon from "../../components/Icon";
import { createClient } from "@supabase/supabase-js";
import moment from "moment";
import packageJson from "../../../package.json";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

const supabase = createClient(
  "https://vqjkcypfolcemvcxpgdw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxamtjeXBmb2xjZW12Y3hwZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ4NzI0MjQsImV4cCI6MjAzMDQ0ODQyNH0.OYfrix-OpHrloU60t4WTyuUTVpMtk9pD89wiQ0DeoQ4"
);

const Dashboard = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [msg, setMsg] = useState("");

  const gameState = MainStore.gameState;

  useEffect(() => {
    MainStore.setMessageApi(messageApi);
    const waitingRoomChannel = supabase.channel("waiting-room");
    waitingRoomChannel
      .on("presence", { event: "join" }, () => {
        MainStore.transformAndSetRoomList(waitingRoomChannel.presenceState());
      })
      .on("presence", { event: "sync" }, () => {
        MainStore.transformAndSetRoomList(waitingRoomChannel.presenceState());
      })
      .subscribe();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const state = gameState?.split("--")[0] || gameState;
    if (SOUND[state]?.play) {
      SOUND[state].play();
    }
  }, [gameState]);
  
  console.log('total:', MainStore.getTotalMoneyPlayers());

  const getMessageFromGameState = () => {
    if (
      MainStore.gameState === GAME_STATES.WAITING &&
      MainStore.players.length > 1 &&
      MainStore.isHost
    ) {
      return (
        <div>
          <Button
            type="primary"
            onClick={async () => {
              await delay(200);
              const randomPlayerId =
                MainStore.players[random(0, MainStore.players.length - 1)].id;
              MainStore.updatePlayingId(randomPlayerId);
              MainStore.updateGameState(GAME_STATES.ROLL_DICE);
              MainStore.sendDataToChannel(["playingId", "gameState"]);
            }}
          >
            Bắt đầu
          </Button>
        </div>
      );
    }
    if (
      MainStore.gameState === GAME_STATES.ROLL_DICE &&
      MainStore.samePlayerRolling === 1 &&
      (MainStore.playingId === MainStore.myName || !MainStore.online)
    )
      return "Chạm để tung xúc xắc";
    if (
      MainStore.gameState === GAME_STATES.ROLL_DICE &&
      MainStore.samePlayerRolling > 1
    )
      return `Được tung lần ${MainStore.samePlayerRolling} do xúc xắc ra đôi`;
    if (
      (MainStore.gameState === GAME_STATES.BUYING ||
        MainStore.gameState === GAME_STATES.UPDATING ||
        MainStore.gameState === GAME_STATES.REBUYING) &&
      buyingProperty &&
      (MainStore.playingId === MainStore.myName || !MainStore.online)
    )
      return (
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          {(MainStore.gameState === GAME_STATES.BUYING ||
            MainStore.gameState === GAME_STATES.REBUYING) && (
            <div>
              Bạn có muốn mua {buyingProperty.name}{" "}
              {MainStore.gameState === GAME_STATES.REBUYING ? (
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
                      filter: "brightness(2)",
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
              {MainStore.gameState === GAME_STATES.REBUYING
                ? MainStore.getRebuyPrice(buyingProperty)
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
              với giá là {buyingProperty.price[updatingPropertyInfo.level]}$ ?
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 15,
            }}
          >
            <Button
              onClick={() => MainStore.nextPlayerTurn()}
              type="primary"
              danger
            >
              Không
            </Button>
            <Button
              type="primary"
              onClick={() =>
                MainStore.buyProperty(
                  currentPlayer,
                  MainStore.gameState === GAME_STATES.REBUYING
                )
              }
            >
              Có
            </Button>
          </div>
        </div>
      );
    if (
      MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY) &&
      MainStore.sellingProperty &&
      (MainStore.playingId === MainStore.myName || !MainStore.online)
    )
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div style={{ display: "flex" }}>
            <span>
              Bạn muốn bán: {sellingPropertyInfor?.level === 6 && "Biệt thự"}
              {sellingPropertyInfor?.level === 1 && "Ô đất"}
              {[2, 3, 4, 5].includes(sellingPropertyInfor.level) &&
                `nhà cấp ${sellingPropertyInfor?.level - 1}`}{" "}
              {sellingProperty.name}
            </span>{" "}
          </div>
          <div style={{ textAlign: "left" }}>
            Tổng bán được: {MainStore.getSellingPrice()}$
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 10,
            }}
          >
            <Button type="primary" onClick={MainStore.sellProperty}>
              OK
            </Button>
          </div>
        </div>
      );
    if (
      MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
      MainStore.gameState.split("--")[2] !== "bank"
    )
      return <div>Đã thanh toán {MainStore.gameState.split("--")[1]}$</div>;
    if (
      MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
      MainStore.gameState.split("--")[2] === "bank" &&
      !MainStore.gameState.split("--")[3]
    )
      return <div>Đã thanh toán {MainStore.gameState.split("--")[1]}$</div>;
    if (
      MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) &&
      MainStore.gameState.split("--")[3] === "new-round"
    )
      return "Nhận được 2000$ vì qua vòng mới";
    if (
      MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
      MainStore.gameState.split("--")[3] === "pay-out-jail"
    )
      return "Phải trả 500$ để ra tù";
    if (
      MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
      MainStore.gameState.split("--")[3] === "fixElectric"
    )
      return "Mất 200$ phí sửa điện";
    if (
      MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
      MainStore.gameState.split("--")[3] === "tax"
    )
      return `Phải nộp thuế ${MainStore.gameState.split("--")[1]}$`;
    if (
      MainStore.gameState.startsWith(GAME_STATES.DEC_MONEY) &&
      MainStore.gameState.split("--")[3] === "jail-visit"
    )
      return `Đi thăm tù hết ${MainStore.gameState.split("--")[1]}$`;
    if (
      MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) &&
      MainStore.gameState.split("--")[3] === "gift"
    )
      return `Nhận được ${MainStore.gameState.split("--")[1]}$ quà sinh nhật`;
    if (MainStore.gameState === GAME_STATES.GOING_JAIL) return "Bị đưa vào tù";
    if (MainStore.gameState === GAME_STATES.GOING_OUT_JAIL)
      return "Được ra tù do xúc xắc ra đôi";
    if (MainStore.gameState === GAME_STATES.DOUBLE_TO_OUT)
      return `Cần xúc xắc ra đôi để ra tù!`;
    if (MainStore.gameState === GAME_STATES.RECEIVER_ON_JAIL)
      return `Không mất tiền do chủ nhà đang ở tù`;
    if (MainStore.gameState === GAME_STATES.MAX_LEVEL_PROPERTY)
      return `Không thể nâng cấp thêm do ô này đã đạt cấp độ tối đa`;
    if (MainStore.gameState.startsWith(GAME_STATES.FLIGHT))
      return `Được bay tới ô ${
        BLOCKS[MainStore.gameState.split("--")[1]].name
      }`;

    if (
      MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY) &&
      !MainStore.sellingProperty
    )
      return "Chọn ô đất muốn bán";
    if (MainStore.gameState.startsWith(GAME_STATES.GOING_BACK))
      return `Bị đi lùi ${MainStore.gameState.split("--")[1]} bước`;
    if (MainStore.gameState.startsWith(GAME_STATES.DOWN_GRADE_BUILDING))
      return (
        <div>
          Người chơi bị buộc bán 1 căn nhà.
          <br />
          {MainStore.gameState.split("--")[1] !== "no-property"
            ? `Bị buộc bán 1 căn nhà ở ${MainStore.gameState.split("--")[1]}`
            : "Không sỡ hữu căn nhà nào"}
        </div>
      );
    if (
      MainStore.gameState.startsWith(GAME_STATES.LOST_ELECTRIC_BUILDING) &&
      !MainStore.gameState.split("--")[1]
    )
      return "Một ô ngẫu nhiên sẽ bị cắt điện";
    if (
      MainStore.gameState.startsWith(GAME_STATES.LOST_ELECTRIC_BUILDING) &&
      MainStore.gameState.split("--")[1]
    )
      return `Ô ${MainStore.gameState.split("--")[1]} bị cắt điện`;
    if (MainStore.gameState === GAME_STATES.CURRENT_LOST_ELECTRIC)
      return "Không mất tiền vì ô hiện tại đang mất điện";
    if (MainStore.gameState === GAME_STATES.FREE_OUT_FAIL_CARD)
      return "Được tặng thẻ miễn đi tù";
    if (MainStore.gameState === GAME_STATES.USE_FREE_CARD)
      return "Đã sử dụng thẻ miễn đi tù";
    if (
      MainStore.gameState === GAME_STATES.ASK_TO_PAY_TO_OUT_JAIL &&
      (MainStore.playingId === MainStore.myName || !MainStore.online)
    )
      return (
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
            <Button type="primary" onClick={() => updatePayToOutJail(true)}>
              Có
            </Button>
          </div>
        </div>
      );
    if (MainStore.gameState === GAME_STATES.RANDOM_TRAVELING)
      return "Đi tới 1 ô của bạn ngẫu nhiên hoặc được tặng 500$ đi du lịch";
    if (MainStore.gameState.startsWith(GAME_STATES.FIXING_ELECTRIC_BUILDING))
      return `Ô ${MainStore.gameState.split("--")[1]} đang được sửa điện`;

    if (MainStore.gameState.startsWith(GAME_STATES.CHOOSE_BUILDING))
      return `Chọn một ô để ${
        CHOOSE_BUILDING_ACTIONS[MainStore.gameState.split("--")[2]]
      }`;

    if (MainStore.gameState.startsWith(GAME_STATES.CHOOSEN_BUILDING))
      return `Đã chon ô ${MainStore.gameState.split("--")[1]} để ${
        CHOOSE_BUILDING_ACTIONS[MainStore.gameState.split("--")[2]]
      }`;

    if (MainStore.gameState.startsWith(GAME_STATES.NO_BLOCK_TO_CHOOSE))
      return `Được chọn ô để ${
        CHOOSE_BUILDING_ACTIONS[MainStore.gameState.split("--")[1]]
      } nhưng chưa có ô nào`;
    return "";
  };

  const handleOk = () => {
    if (!MainStore.online) {
      MainStore.updateGameState(GAME_STATES.ROLL_DICE);
      const randomPlayerId =
        MainStore.players[random(0, MainStore.players.length - 1)].id;
      MainStore.updatePlayingId(randomPlayerId);
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
        const waitingRoomChannel = supabase.channel("waiting-room", {
          config: {
            presence: {
              key: MainStore.roomId,
            },
          },
        });
        waitingRoomChannel.subscribe((status) => {
          if (status !== "SUBSCRIBED") {
            return;
          }

          waitingRoomChannel.track({
            data: {
              roomId: MainStore.roomId,
              totalPlayers: MainStore.players.length,
              hostName: MainStore.myName,
              created: moment().toISOString(),
              version: packageJson.version,
            },
          });
        });
        MainStore.channel
          .on("broadcast", { event: "updateStore" }, (payload) => {
            MainStore.updateStore(get(payload, ["payload", "data"], {}));
          })
          .on("presence", { event: "join" }, ({ key }) => {
            if (key === "host") {
              return;
            }
            if (
              MainStore.players.length + 1 <= MainStore.totalPlayers &&
              MainStore.players.findIndex((p) => p.name === key) === -1
            ) {
              MainStore.addPlayer(key);
            }
            MainStore.channel.track({
              data: pick(MainStore, [...SYNC_KEY, "loans"]),
            });
          })
          .subscribe((status) => {
            if (status !== "SUBSCRIBED") {
              return;
            }

            MainStore.channel.track({
              data: pick(MainStore, SYNC_KEY),
            });
          });
      } else {
        MainStore.channel
          .on("broadcast", { event: "updateStore" }, (payload) => {
            MainStore.updateStore(get(payload, ["payload", "data"], {}));
          })
          .on("presence", { event: "sync" }, () => {
            const newState = MainStore.channel.presenceState();
            const newStoreData = get(newState, ["host", "0", "data"], {});
            if (
              newStoreData.gameState === GAME_STATES.WAITING ||
              !MainStore.sync
            ) {
              MainStore.updateStore(newStoreData);
              MainStore.setSync(newState.gameState !== GAME_STATES.WAITING);
            }
          })
          .subscribe((status) => {
            if (status !== "SUBSCRIBED") {
              return;
            }

            MainStore.channel
              .track({
                online_at: new Date().toISOString(),
              })
              .then(() => MainStore.updateGameState(GAME_STATES.WAITING));
          });
      }
    }
  };

  const currentPlayerIndex = MainStore.players.findIndex(
    (p) => p.id === MainStore.playingId
  );
  const currentPlayer = MainStore.players[currentPlayerIndex];

  const buyingProperty = BLOCKS.find(
    (block) => block.name === MainStore.buyingProperty
  );

  const updatingPropertyInfo =
    MainStore.ownedBlocks[buyingProperty?.name] || {};

  const sellingProperty = BLOCKS.find(
    (block) => block.name === MainStore.sellingProperty
  );
  const sellingPropertyInfor = MainStore.ownedBlocks[MainStore.sellingProperty];

  const updatePayToOutJail = (payToOutJail) => {
    MainStore.updatePlayerData(currentPlayer, "payToOutJail", payToOutJail);
    MainStore.updateGameState(GAME_STATES.RESPONDED_PAY_OUT_JAIL);
    MainStore.sendDataToChannel(["gameState", "players"]);
  };

  const openChat = debounce(MainStore.openChat, 100);

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Enter" && !MainStore.showChat) {
        openChat();
      }
    });
  }, [openChat]);

  const chatInput = (
    <Dropdown
      trigger="click"
      menu={{
        items: msg.startsWith("/mm")
          ? range(1, MEME.length + 1).map((numb, id) => ({
              key: id,
              label: `/mm ${numb} (${MEME[id]})`,
            }))
          : [],
      }}
      placement="bottomLeft"
      arrow
      open={msg.startsWith("/mm")}
    >
      <Input
        style={{
          width: "100%",
        }}
        autoFocus
        placeholder="Nhập nội dung chat hoặc gửi meme sound bằng cú pháp /mm <số 1 - 9>"
        name="chat"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      />
    </Dropdown>
  );

  const sendChat = (e) => {
    e.preventDefault();
    if (e.target[0]?.value) {
      const message = e.target[0].value;
      MainStore.addChat(
        MainStore.myName,
        message + "--" + new Date().toISOString()
      );
      MainStore.channel
        .send({
          type: "broadcast",
          event: "updateStore",
          payload: {
            data: {
              chat: { [MainStore.myName]: e.target[0]?.value },
            },
          },
        })
        .then(() => {
          if (message.startsWith("/mm")) {
            SOUND["meme" + message.split("/mm ")[1]]?.play();
          } else {
            SOUND.chat.play();
          }
        });
      setMsg("");
    }
    MainStore.closeChat();
  };

  const requestLoan = (myId, playerId) => {
    const newLoan = {
      id: uuidv4(),
      from: myId,
      to: playerId,
      status: "request",
    };
    MainStore.updateLoans(newLoan, messageApi);
    MainStore.channel.send({
      type: "broadcast",
      event: "updateStore",
      payload: {
        data: {
          loans: newLoan,
        },
      },
    });
  };

  return (
    <TransformWrapper
      minScale={0.5}
      initialScale={window.innerWidth > 950 ? 0.95 : 0.85}
      centerOnInit
      limitToBounds={false}
      panning={{
        excluded: ["input", "button"],
        allowMiddleClickPan: false,
        allowRightClickPan: false,
      }}
      doubleClick={{ disabled: true }}
    >
      <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }}>
        <div
          className="container-page"
          style={{
            gridAutoRows: `minmax(${parseInt(window.innerHeight / 8)}px, 1fr)`,
            gridAutoColumns: `minmax(${
              parseInt(window.innerWidth / 12) +
              (window.innerWidth > 950 ? 0 : 5)
            }px, 1fr)`,
          }}
        >
          {BLOCKS.map((block, index) => (
            <Block
              key={block.name + index}
              block={block}
              idx={index}
              active={
                currentPlayer && (currentPlayer.position - 1) % 36 === index
              }
            />
          ))}
          {MainStore.players.map(
            (player, index) =>
              !player.broke && (
                <div
                  style={{
                    ...getBlockPositionStyle(player.position - 1),
                    opacity:
                      MainStore.gameState.startsWith(GAME_STATES.NEED_MONEY) ||
                      MainStore.gameState.startsWith(
                        GAME_STATES.CHOOSE_BUILDING
                      )
                        ? 0.2
                        : 1,
                    pointerEvents: "none",
                    zIndex:
                      MainStore.playingId === player.id ? 1000 : undefined,
                  }}
                  className="player"
                  key={player.id}
                  id={"player--" + player.id}
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
                        (index === 2 || index === 3) &&
                        MainStore.totalPlayers > 2
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
              backgroundColor: "transparent",
            }}
            className="center-space"
          >
            <div
              style={{
                position: "absolute",
                bottom: 10,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "end",
                fontSize: 12,
                color: "white",
              }}
            >
              Phòng: {MainStore.roomId} &nbsp;&nbsp; Version:{" "}
              {packageJson.version}
            </div>
            {MainStore.players.map((player, index) => {
              let position = {};
              if ([0, 1].includes(index)) {
                position.top = 0;
              }
              if ([0, 2].includes(index)) {
                position.left = 0;
              }
              if ([1, 3].includes(index)) {
                position.right = 0;
              }
              if ([2, 3].includes(index)) {
                position.bottom = 0;
              }
              return (
                <div
                  style={{
                    position: "absolute",
                    maxWidth: 200,
                    minWidth: 150,
                    border: "1px solid",
                    borderColor: COLORS[index],
                    borderRadius: 5,
                    display: "flex",
                    background: "rgba(0,0,0,0.2)",
                    flexDirection: "column",
                    ...position,
                  }}
                  key={player.id}
                >
                  <div
                    style={{
                      [[0, 1].includes(index) ? "bottom" : "top"]: -37,
                      [[0, 2].includes(index) ? "left" : "right"]: 0,
                      display: "flex",
                      justifyContent: [0, 2].includes(index)
                        ? "flex-start"
                        : "flex-end",
                    }}
                    className="player-action"
                  >
                    {contextHolder}
                    {player.id === MainStore.myName && (
                      <Popconfirm
                        title={"Đầu hàng"}
                        description={"Bạn muốn đầu hàng không?"}
                        onConfirm={MainStore.surrender}
                        okText={"Đầu hàng"}
                        cancelText="Không"
                      >
                        <Button
                          ghost
                          size="middle"
                          shape="circle"
                          style={{
                            marginRight: 5,
                          }}
                          icon={
                            <Icon symbol="flag" width="20px" height="20px" />
                          }
                        />
                      </Popconfirm>
                    )}
                    {player.id !== MainStore.myName &&
                      MainStore.playingId === MainStore.myName &&
                      player.money >= 500 &&
                      !player.loan &&
                      MainStore.loans[MainStore.myName]?.status !== "request" &&
                      !MainStore.gameState.includes(GAME_STATES.NEED_MONEY) &&
                      !currentPlayer.onJail &&
                      !currentPlayer?.loan &&
                      !player.broke && (
                        <Popconfirm
                          title={"Xin tiền"}
                          description={`Bạn có muốn xin tiền ${player.id} không?`}
                          onConfirm={() =>
                            requestLoan(currentPlayer.id, player.id)
                          }
                          okText="Xin tiền"
                          cancelText="Không"
                        >
                          <Button
                            ghost
                            size="middle"
                            icon={
                              <Icon
                                symbol="request-money"
                                width="20px"
                                height="20px"
                              />
                            }
                            iconPosition="end"
                            shape="circle"
                          ></Button>
                        </Popconfirm>
                      )}
                  </div>

                  <Popover
                    placement={[0, 2].includes(index) ? "right" : "left"}
                    content={
                      <div
                        style={{
                          color: COLORS[index],
                          fontWeight: "bold",
                          fontSize: 15,
                        }}
                      >
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
                  >
                    <div
                      style={{
                        color: "white",
                        backgroundColor: COLORS[index],
                        padding: 10,
                        display: "flex",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: "bold",
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                      }}
                    >
                      {player.name}
                    </div>
                  </Popover>

                  <div
                    key={player.id}
                    style={{
                      alignItems: "center",
                      position: "relative",
                      padding: 10,
                    }}
                    className="pc"
                  >
                    {player.broke && (
                      <Icon
                        style={{ position: "absolute", left: 8 }}
                        symbol="stop"
                        width="30px"
                        height="30px"
                      />
                    )}

                    <img
                      style={{
                        flex: "0 0 25px",
                        height: 25,
                        marginRight: 10,
                        order: 0,
                      }}
                      alt=""
                      src={AVATARS[index]}
                    />

                    <div
                      style={{
                        fontSize: 17,
                        textDecoration: player.broke
                          ? "line-through"
                          : undefined,
                        fontWeight: "bold",
                        color: "white",
                      }}
                    >
                      {player.money}$
                    </div>
                  </div>
                </div>
              );
            })}
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
                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: 6,
                      color: "white",
                    }}
                    onClick={openChat}
                  >
                    Nhấn <strong>Enter/chạm</strong> để chat
                  </div>
                )}
                {MainStore.showChat && chatInput}
              </form>
            )}
            {/* {(MainStore.online ||
              (MainStore.online &&
                MainStore.gameState !== GAME_STATES.WAITING &&
                !MainStore.players[
                  MainStore.getPlayerIndexById(MainStore.myName)
                ]?.broke)) && (
              <Popconfirm
                title={!MainStore.online ? "Chơi lại" : "Đầu hàng"}
                description={`Bạn muốn ${
                  !MainStore.online
                    ? "hủy ván hiện tại và chơi lại"
                    : "đầu hàng"
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
                    opacity: MainStore.gameState.startsWith(
                      GAME_STATES.NEED_MONEY
                    )
                      ? 0.5
                      : 1,
                  }}
                >
                  {!MainStore.online ? "Chơi lại" : "Đầu hàng"}
                </Button>
              </Popconfirm>
            )} */}

            {MainStore.gameState !== GAME_STATES.INIT &&
              MainStore.loans[MainStore.myName]?.status !== "request" && (
                <div className="information" onClick={MainStore.rollDice}>
                  <div
                    className="information__row"
                    style={{
                      width: "100%",
                      minHeight: 50,
                      padding: 5,
                      marginTop: 10,
                      color: "white",
                      fontWeight: "bold",
                      borderRadius: 10,
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    {getMessageFromGameState() && (
                      <div
                        style={{
                          padding: 15,
                          textAlign: "center",
                          width: "100%",
                        }}
                        className=" fade-in-top "
                        key={MainStore.gameState}
                      >
                        {getMessageFromGameState()}
                      </div>
                    )}
                  </div>

                  <div className="information__row">
                    {MainStore.gameState === GAME_STATES.WAITING && (
                      <>
                        {range(0, MainStore.totalPlayers).map((idx, index) => (
                          <PlayerInfor
                            key={
                              (MainStore.players[idx]?.id || "noname-") + index
                            }
                            playerId={MainStore.players[idx]?.id}
                          />
                        ))}
                      </>
                    )}
                    {MainStore.gameState !== GAME_STATES.WAITING && (
                      <PlayerInfor playerId={MainStore.playingId} />
                    )}

                    {(MainStore.gameState.startsWith(GAME_STATES.INC_MONEY) ||
                      MainStore.gameState.startsWith(
                        GAME_STATES.DEC_MONEY
                      )) && (
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
                              MainStore.gameState.startsWith(
                                GAME_STATES.DEC_MONEY
                              )
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
                              style={{
                                width: 30,
                                height: 30,
                                position: "relative",
                              }}
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
                            {parseInt(MainStore.gameState.split("--")[1]) >=
                              2000 &&
                              parseInt(MainStore.gameState.split("--")[1]) <
                                3000 && (
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
                            {parseInt(MainStore.gameState.split("--")[1]) >=
                              3000 &&
                              range(
                                1,
                                Math.floor(
                                  parseInt(MainStore.gameState.split("--")[1]) /
                                    1000
                                ) > 25
                                  ? 25
                                  : Math.floor(
                                      parseInt(
                                        MainStore.gameState.split("--")[1]
                                      ) / 1000
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
                                        14 *
                                        ((numb % 2 !== 0 ? numb + 1 : numb) /
                                          2),
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
                            <Icon
                              symbol="bank"
                              width={"120px"}
                              height={"80px"}
                            />
                            <div
                              style={{
                                fontWeight: "bold",
                                textAlign: "center",
                                textShadow: `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000`,
                                color: "white",
                                marginTop: 10,
                              }}
                            >
                              {MainStore.gameState.startsWith(
                                GAME_STATES.INC_MONEY
                              )
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
                          <div
                            style={{ display: "flex" }}
                            className={
                              MainStore.gameState === GAME_STATES.ROLLING_DICE
                                ? "bounce-top"
                                : ""
                            }
                          >
                            <Die value={MainStore.dice[0]} />
                            <Die
                              style={{ marginLeft: -20 }}
                              value={MainStore.dice[1]}
                            />
                          </div>

                          {MainStore.gameState.startsWith(
                            GAME_STATES.NEED_MONEY
                          ) && (
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
                                  style={{
                                    position: "absolute",
                                    left: -20,
                                  }}
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
            footer={
              MainStore.online && MainStore.isHost ? (
                [
                  <Button key="submit" onClick={handleOk}>
                    Tạo phòng
                  </Button>,
                ]
              ) : !MainStore.online ? (
                <Button key="submit" onClick={handleOk}>
                  Bắt đầu
                </Button>
              ) : null
            }
            maskClosable={false}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
              {MainStore.online && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <p style={{ flex: "0 0 auto", marginRight: 10 }}>
                    Tạo phòng mới:
                  </p>
                  <Switch
                    value={MainStore.isHost}
                    onChange={MainStore.setHost}
                  />
                </div>
              )}
            </div>
            {MainStore.online && (
              <>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <p style={{ flex: "0 0 auto", marginRight: 10 }}>Nhập tên:</p>
                  <Input
                    value={MainStore.myName}
                    onChange={(e) => MainStore.setMyName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                  />
                </div>
                {!MainStore.isHost && MainStore.roomList.length > 0 && (
                  <Table
                    rowKey="roomId"
                    columns={[
                      {
                        title: "ID",
                        dataIndex: "roomId",
                      },
                      {
                        title: "Chủ phòng",
                        dataIndex: "hostName",
                      },
                      {
                        title: "Thời gian",
                        dataIndex: "created",
                        defaultSortOrder: "descend",
                        sorter: (a, b) => new Date(b) - new Date(a),
                        render: (value) => moment(value).fromNow(),
                      },
                      {
                        title: "Version",
                        dataIndex: "version",
                      },
                      {
                        title: "",
                        dataIndex: "roomId",
                        render: (value, record) => (
                          <Button
                            type="primary"
                            onClick={() => {
                              if (packageJson.version !== record.version) {
                                MainStore.messageApi.open({
                                  type: "error",
                                  content: `Vui lòng nâng cấp lên phiên bản ${record.version} để tham gia`,
                                  duration: 2,
                                });
                                return;
                              }
                              MainStore.setRoomId(value);
                              handleOk();
                            }}
                          >
                            Tham gia
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={MainStore.roomList}
                    pagination={false}
                  />
                )}
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
              <PlayerInfor
                playerId={MainStore.players.find((p) => p.winner)?.id}
              />
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
      </TransformComponent>
    </TransformWrapper>
  );
};

export default observer(Dashboard);
