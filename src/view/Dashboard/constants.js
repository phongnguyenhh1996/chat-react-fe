import avatar1 from "../../asset/img/avatar1.svg";
import avatar2 from "../../asset/img/avatar2.svg";
import avatar3 from "../../asset/img/avatar3.svg";
import avatar4 from "../../asset/img/avatar4.svg";

export const BLOCKS = [
  {
    type: "start",
    name: "Khởi hành",
    position: 'bottom'
  },
  {
    type: "chance",
    name: "Cơ hội",
    position: 'bottom'
  },
  {
    type: "property",
    name: "Phú Quốc",
    price: [1500, 750, 750, 750, 750, 4500],
    row: '#BC9A6C',
    position: 'bottom'
  },
  {
    type: "property",
    name: "Lào Cai",
    price: [1600, 800, 800, 800, 800, 4800],
    row: '#73D1F7',
    position: 'bottom'
  },
  {
    type: "property",
    name: "Việt Trì",
    price: [1800, 900, 900, 900, 900, 5400],
    row: '#73D1F7',
    position: 'bottom'
  },
  {
    type: "property",
    name: "Hòa Bình",
    price: [1700, 850, 850, 850, 850, 5100],
    row: '#73D1F7',
    position: 'bottom'
  },
  {
    type: "property",
    name: "Hạ Long",
    price: [2500, 1250, 1250, 1250, 1250, 7500],
    row: '#EF62A4',
    position: 'bottom'
  },
  {
    type: "property",
    name: "Hải Phòng",
    price: [3200, 1600, 1600, 1600, 1600, 9600],
    row: '#EF62A4',
    position: 'bottom'
  },
  {
    type: "public",
    name: "Nhà ga",
    position: 'bottom',
    price: [1000],
  },
  {
    type: "badluck",
    name: "Khí vận",
    position: 'bottom'
  },
  {
    type: "property",
    name: "Hà Nội",
    price: [3500, 1750, 1750, 1750, 1750, 10500],
    row: '#EF62A4',
    position: 'bottom'
  },
  {
    type: "jail-visit",
    name: "Trại giam",
    position: 'bottom'
  },
  {
    type: "property",
    name: "Hải Dương",
    price: [2200, 1100, 1100, 1100, 1100, 6600],
    row: "#F7BEFF",
    position: 'left'
  },
  {
    type: "property",
    name: "Thái Bình",
    price: [2000, 1000, 1000, 1000, 1000, 6000],
    row: "#F7BEFF",
    position: 'left'
  },
  {
    type: "property",
    name: "Nam Định",
    price: [2400, 1200, 1200, 1200, 1200, 7200],
    row: "#F7BEFF",
    position: 'left'
  },
  {
    type: "public",
    name: "Điện lực",
    price: [1000],
    position: 'left'
  },
  {
    type: "property",
    name: "Thanh Hóa",
    price: [2700, 1350, 1350, 1350, 1350, 8100],
    row: "#ff6969",
    position: 'left'
  },
  {
    type: "property",
    name: "Vinh",
    price: [2600, 1300, 1300, 1300, 1300, 7800],
    row: "#ff6969",
    position: 'left'
  },
  {
    type: "plane",
    name: "Sân bay",
    position: 'top'
  },
  {
    type: "property",
    name: "Hà Tĩnh",
    price: [1500, 750, 750, 750, 750, 4500],
    row: "#ff6969",
    position: 'top'
  },
  {
    type: "chance",
    name: "Cơ hội",
    position: 'top'
  },
  {
    type: "property",
    name: "Huế",
    price: [2700, 1350, 1350, 1350, 1350, 8100],
    row: "#7FC5CA",
    position: 'top'
  },
  {
    type: "property",
    name: "Đà Nẵng",
    price: [3000, 1500, 1500, 1500, 1500, 9000],
    row: "#7FC5CA",
    position: 'top'
  },
  {
    type: "property",
    name: "Hội An",
    price: [2200, 1100, 1100, 1100, 1100, 6600],
    row: "#7FC5CA",
    position: 'top'
  },
  {
    type: "public",
    name: "Bến xe",
    position: 'top',
    price: [1000]
  },
  {
    type: "property",
    name: "Kon Tum",
    price: [1400, 700, 700, 700, 700, 4200],
    row: '#F69733',
    position: 'top'
  },
  {
    type: "property",
    name: "Pleiku",
    price: [1600, 800, 800, 800, 800, 4800],
    row: '#F69733',
    position: 'top'
  },
  {
    type: "property",
    name: "Đà Lạt",
    price: [2700, 1350, 1350, 1350, 1350, 8100],
    row: '#F69733',
    position: 'top'
  },
  {
    type: "badluck",
    name: "Khí vận",
    position: 'top'
  },
  {
    type: "jail",
    name: "Vô tù",
    position: 'top'
  },
  {
    type: "property",
    name: "Vũng tàu",
    price: [2600, 1300, 1300, 1300, 1300, 7800],
    row: '#FFCC29',
    position: 'right'
  },
  {
    type: "property",
    name: "Biên Hòa",
    price: [2800, 1400, 1400, 1400, 1400, 8400],
    row: '#FFCC29',
    position: 'right'
  },
  {
    type: "property",
    name: "TP. HCM",
    price: [3500, 1750, 1750, 1750, 1750, 10500],
    row: '#FFCC29',
    position: 'right'
  },
  {
    type: "public",
    name: "Bến cảng",
    position: 'right',
    price: [1000]
  },
  {
    type: "property",
    name: "Cần Thơ",
    price: [3000, 1500, 1500, 1500, 1500, 9000],
    row: '#BC9A6C',
    position: 'right'
  },
  {
    type: "property",
    name: "Cà mau",
    price: [1500, 750, 750, 750, 750, 4500],
    row: '#BC9A6C',
    position: 'right'
  },
];

export const COLORS = ["darkred", "darkblue", "#FF5722", "darkgreen"];

export const AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const GAME_STATES = {
  INIT: "init",
  WAITING: "waiting",
  ROLL_DICE: "roll_dice",
  ROLLING_DICE: "rolling_dice",
  MOVING: "moving",
  BUYING: 'buying',
  UPDATING: "updating",
  SWITCH_TURN: "switch_turn",
  INC_MONEY: "inc_money",
  DEC_MONEY: "dec_money",
  GOING_JAIL: "going_jail",
  GOING_OUT_JAIL: "going_out_jail",
  NO_BONUS: 'no_bonus',
  DOUBLE_TO_OUT: "double_to_out",
  RECEIVER_ON_JAIL: "receiver_on_jail",
  MAX_LEVEL_PROPERTY: "max_level_property",
  FLIGHT: "flight",
  NOT_ENOUGH_MONEY_UPDATING_PROPERTY: "not_enough_money_updating_property",
  NOT_ENOUGH_MONEY_BUYING_PROPERTY: "not_enough_money_buying_property",
  NEED_MONEY: 'need_money',
  GOING_BACK: "going_back",
  DOWN_GRADE_BUILDING: 'down_grade_building',
  LOST_ELECTRIC_BUILDING: 'lost_lectric_building',
  CURRENT_LOST_ELECTRIC: 'current_lost_electric',
  FREE_OUT_FAIL_CARD: 'free_out_fail_card',
  USE_FREE_CARD: 'use_free_card',
  FIXING_ELECTRIC_BUILDING: 'fixing_electric_building',
  RANDOM_TRAVELING: 'random_traveling',
  CHOOSE_FESTIVAL_BUILDING: 'choose_festival_building',
  NO_BLOCK_TO_CHOOSE_FESTIVAL_BUILDING: 'no_block_to_choose_festival_building'
};
