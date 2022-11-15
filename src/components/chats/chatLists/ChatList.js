import React from "react";
import Scrollbars from "react-custom-scrollbars-2";
import Avatar from "../../Avatar";
import { dataChat } from "./../dataChat";
import "./style.scss";
const ChatList = () => {
  return (
    <div className="chats__all_list">
      <h5 className="text__name">Recent</h5>
      <Scrollbars
        autoHeight
        autoHeightMax={420}
        autoHide
        autoHideDuration={200}
      >
        <ul className="chat__list">
          {dataChat.map((data, index) => (
            <li className="chat__list_item" key={index}>
              <div className="child">
                <Avatar isOnline={true} img={data.avatar} />
                <div className="message__content">
                  <h5 className="user__name">{data.name}</h5>
                  <p className="message">{data.message}</p>
                </div>
                <div className="time__message">
                  <div className="time">{data.time}</div>
                  <div className="number-message"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Scrollbars>
    </div>
  );
};

export default ChatList;
