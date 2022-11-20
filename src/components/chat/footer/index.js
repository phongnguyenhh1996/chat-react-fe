import React, { useState } from "react";

import "./style.scss";

import { BsEmojiSmile, BsFillImageFill } from "react-icons/bs";
import { RiSendPlane2Fill } from "react-icons/ri";
import { IoMdAttach } from "react-icons/io";

const Footer = ({ addNewMessage }) => {
  const [value, setValue] = useState("");

  const sendMessage = (value) => {
    addNewMessage(value);
    setValue("");
  };

  return (
    <div className="footer-message">
      <div className="footer-message__main">
        <div className="footer-message__left">
          <input
            placeholder="Enter Message..."
            type=""
            name=""
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              console.log(e.key === "Enter");
              // eslint-disable-next-line no-unused-expressions
              e.key === "Enter" ? sendMessage(value) : null;
            }}
          />
        </div>
        <div className="footer-message__right">
          <BsEmojiSmile />
          <IoMdAttach />
          <BsFillImageFill />
          <button className="btn-send" onClick={() => sendMessage(value)}>
            <RiSendPlane2Fill />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Footer;
