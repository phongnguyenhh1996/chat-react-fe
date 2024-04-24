import React, { useState } from "react";
import { range } from "lodash";
import { Button, Modal, InputNumber } from "antd";
import { observer } from "mobx-react-lite";
import MainStore from "./MainStore";

const blocks = [
  {
    type: "plane",
    name: "Sân bay",
  },
  {
    type: "chance",
    name: "Cơ hội",
  },
  {
    type: "property",
    name: "Huế",
    price: [2700, 1350, 1350, 1350, 1350, 8100],
    row: "blue",
  },
  {
    type: "property",
    name: "Đà Nẵng",
    price: [3000, 1500, 1500, 1500, 1500, 9000],
    row: "blue",
  },
  {
    type: "property",
    name: "Hội An",
    price: [2200, 1100, 1100, 1100, 1100, 6600],
    row: "blue",
  },
  {
    type: "public",
    name: "Bến xe",
  },
  {
    type: "property",
    name: "Kon Tum",
    price: [1400, 700, 700, 700, 700, 4200],
    row: "green",
  },
  {
    type: "property",
    name: "Pleiku",
    price: [1600, 800, 800, 800, 800, 4800],
    row: "green",
  },
  {
    type: "property",
    name: "Đà Lạt",
    price: [2700, 1350, 1350, 1350, 1350, 8100],
    row: "green",
  },
  {
    type: "badluck",
    name: "Khí vận",
  },
  {
    type: "property",
    name: "Nha Trang",
    price: [2800, 1400, 1400, 1400, 1400, 8400],
    row: "pink",
  },
  {
    type: "jail",
    name: "Vô tù",
  },
  {
    type: "property",
    name: "Vũng tàu",
    price: [2600, 1300, 1300, 1300, 1300, 7800],
    row: "pink",
  },
  {
    type: "property",
    name: "Biên Hòa",
    price: [2800, 1400, 1400, 1400, 1400, 8400],
    row: "pink",
  },
  {
    type: "property",
    name: "TP. HCM",
    price: [3500, 1750, 1750, 1750, 1750, 10500],
    row: "pink",
  },
  {
    type: "public",
    name: "Bến cảng",
  },
  {
    type: "property",
    name: "Cần Thơ",
    price: [3000, 1500, 1500, 1500, 1500, 9000],
    row: "grey",
  },
  {
    type: "property",
    name: "Cà mau",
    price: [1500, 750, 750, 750, 750, 4500],
    row: "grey",
  },
  {
    type: "start",
    name: "Khởi hành",
  },
  {
    type: "chance",
    name: "Cơ hội",
  },
  {
    type: "property",
    name: "Phú Quốc",
    price: [1500, 750, 750, 750, 750, 4500],
    row: "grey",
  },
  {
    type: "property",
    name: "Lào Cai",
    price: [1600, 800, 800, 800, 800, 4800],
    row: "lightgreen",
  },
  {
    type: "property",
    name: "Việt Trì",
    price: [1800, 900, 900, 900, 900, 5400],
    row: "lightgreen",
  },
  {
    type: "property",
    name: "Hòa Bình",
    price: [1700, 850, 850, 850, 850, 5100],
    row: "lightgreen",
  },
  {
    type: "property",
    name: "Hạ Long",
    price: [2500, 1250, 1250, 1250, 1250, 7500],
    row: "rosybrown",
  },
  {
    type: "property",
    name: "Hải Phòng",
    price: [3200, 1600, 1600, 1600, 1600, 9600],
    row: "rosybrown",
  },
  {
    type: "public",
    name: "Nhà ga",
  },
  {
    type: "badluck",
    name: "Khí vận",
  },
  {
    type: "property",
    name: "Hà Nội",
    price: [3500, 1750, 1750, 1750, 1750, 10500],
    row: "rosybrown",
  },
  {
    type: "jail-visit",
    name: "Trại giam",
  },
  {
    type: "property",
    name: "Hải Dương",
    price: [2200, 1100, 1100, 1100, 1100, 6600],
    row: "purple",
  },
  {
    type: "property",
    name: "Thái Bình",
    price: [2000, 1000, 1000, 1000, 1000, 6000],
    row: "purple",
  },
  {
    type: "property",
    name: "Nam Định",
    price: [2400, 1200, 1200, 1200, 1200, 7200],
    row: "purple",
  },
  {
    type: "property",
    name: "Thanh Hóa",
    price: [2700, 1350, 1350, 1350, 1350, 8100],
    row: "darkred",
  },
  {
    type: "property",
    name: "Vinh",
    price: [2600, 1300, 1300, 1300, 1300, 7800],
    row: "darkred",
  },
  {
    type: "property",
    name: "Hà Tĩnh",
    price: [1500, 750, 750, 750, 750, 4500],
    row: "darkred",
  },
];

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(2);

  const getBlockPositionStyle = (idx) => {
    let style = {};
    if (idx >= 0 && idx < 12) {
      style.top = 0;
      style.left = `${((idx / 12) * 100).toFixed(2)}%`;
    }
    if (idx >= 12 && idx <= 17) {
      style.right = 0;
      style.top = `${(((idx - 12) / 8) * 100 + 12.5).toFixed(2)}%`;
    }
    if (idx >= 18 && idx <= 29) {
      style.bottom = 0;
      style.right = `${(((idx - 18) / 12) * 100).toFixed(2)}%`;
    }
    if (idx >= 30) {
      style.left = 0;
      style.bottom = `${(((idx - 30) / 8) * 100 + 12.5).toFixed(2)}%`;
    }
    return style;
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  console.log(MainStore.totalPlayers);

  return (
    <div className="container-page">
      {range(1, 37).map((numb, index) => (
        <div
          style={{
            background: blocks[index]?.row,
            ...getBlockPositionStyle(index),
          }}
          className="block"
          key={numb}
        >
          <span
            style={{
              color: blocks[index]?.type === "property" ? "white" : "black",
            }}
          >
            {blocks[index]?.name || numb}
          </span>
          <span style={{ color: "white" }}>
            {blocks[index]?.price && blocks[index]?.price[0] + "$"}
          </span>
        </div>
      ))}
      <div className="center-space">Center Space</div>
      <Modal
        open={isModalOpen}
        footer={[
          <Button key="submit" onClick={handleOk}>
            Bắt đầu
          </Button>,
        ]}
        maskClosable={false}
      >
        <p>Tổng số người chơi:</p>
        <InputNumber
          min={1}
          max={4}
          value={MainStore.totalPlayers}
          onChange={MainStore.updateTotalPlayers}
        />
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    </div>
  );
};

export default observer(Dashboard);
