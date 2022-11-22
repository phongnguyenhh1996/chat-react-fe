import React from "react";
import { GoClock } from "react-icons/go";

const Message = ({ user }) => {
  const styleBoxConversation = user.isMy
    ? "box-message-user"
    : "box-message-guest";
  const styleConversation = !user.isMy || "box-message__conversation-user";
  return (
    <div className={`box-message ${styleBoxConversation}`}>
      <div className={`box-message__conversation ${styleConversation}`}>
        <div className="box-message__avatar">
          <img src={user.imageUser} alt="chatvia" />
        </div>
        <div className="box-message__content">
          <div className="box-message__content__wrap">
            {user.textMessage.map((message, index) => (
              <div key={index} className="box-message__content__wrap__text">
                <p>{message.text}</p>
                <p className="box-message__content__wrap__time">
                  <GoClock />
                  <span className="align-middle">{message.time}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="box-message__name">{user.nameUser}</div>
        </div>
      </div>
    </div>
  );
};

export default Message;
