import React from "react";

import "./style.scss";

import { BiSearch } from "react-icons/bi";
import { BsTelephone, BsThreeDots } from "react-icons/bs";
import { RiVidiconLine } from "react-icons/ri";
import { HiOutlineUser } from "react-icons/hi";
import { AiOutlineCheckCircle } from "react-icons/ai";

const Header = () => {
  return (
    <div className="header-message">
      <div className="header-message__main">
        <div className="header-message__left">
          <div className="header-message__avatar">
            <img
              className="header-message__avatar__image"
              src="http://chatvia-light.react.themesbrand.com/static/media/avatar-4.b23e41d9c09997efbc21.jpg"
              alt=""
            />
            <div className="header-message__avatar__name">
              <span>Doris Brown</span>
              <AiOutlineCheckCircle />
            </div>
          </div>
        </div>
        <div className="header-message__right">
          <BiSearch className="header-message__right__Search" />
          <BsTelephone className="header-message__right__Telephone" />
          <RiVidiconLine className="header-message__right__VidiconLine" />
          <HiOutlineUser className="header-message__right__OutlineUser" />
          <BsThreeDots className="header-message__right__ThreeDots" />
        </div>
      </div>
    </div>
  );
};

export default Header;
