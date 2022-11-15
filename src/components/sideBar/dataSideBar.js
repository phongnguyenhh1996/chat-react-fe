import {
  AiOutlineUser,
  AiOutlineSetting,
  AiOutlineProfile,
  AiOutlineLogout,
} from "react-icons/ai";
import { BsChatRightDots } from "react-icons/bs";
import { BiGroup, BiMoon } from "react-icons/bi";
import { RiContactsLine } from "react-icons/ri";
import { MdLanguage } from "react-icons/md";
import Usa from "../../asset/img/usa.jpg";
import Spa from "../../asset/img/spa.jpg";
import Ita from "../../asset/img/ita.jpg";
import Gre from "../../asset/img/ger.jpg";

export const SideBars = [
  {
    title: "Profile",
    icon: AiOutlineUser,
  },
  {
    title: "Chats",
    icon: BsChatRightDots,
  },
  {
    title: "Groups",
    icon: BiGroup,
  },
  {
    title: "Contacts",
    icon: RiContactsLine,
  },
  {
    title: "Settings",
    icon: AiOutlineSetting,
  },
];
export const SideBarsBtn = [
  {
    title: "Language",
    icon: MdLanguage,
  },
  {
    title: "Dark / Light Mode",
    icon: BiMoon,
  },
];
export const SideBarsDropDown = [
  {
    title: "English",
    img: Usa,
  },
  {
    title: "Spanish",
    img: Spa,
  },
  {
    title: "German",
    img: Gre,
  },
  {
    title: "Italy",
    img: Ita,
  },
];
export const SideBarsUser = [
  {
    title: "Profile",
    icon: AiOutlineProfile,
  },
  {
    title: "Setting",
    icon: AiOutlineSetting,
  },
  {
    title: "divider",
  },
  {
    title: "Log out",
    icon: AiOutlineLogout,
  },
];
