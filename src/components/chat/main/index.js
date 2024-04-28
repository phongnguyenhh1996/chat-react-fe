import React, { useEffect } from "react";
import Message from "../message";

import "./style.scss";

import { useDispatch, useSelector } from "react-redux";
import { chatList, addMessage } from "../chatSlice";
import moment from "moment";
import Header from "../header";
import Footer from "../footer";

const Chat = () => {
  const dispatch = useDispatch();

  const chatLists = useSelector(chatList);

  const addNewMessage = (value) => {
    if (!value) return;
    const newMessage = {
      id: new Date().toString(),
      textMessage: value,
      nameUser: "hieu",
      time: `${moment().hour()}: ${moment().minutes()}`,
      imageUser:
        "http://chatvia-light.react.themesbrand.com/static/media/avatar-7.5ba5195e48f4c2c3c3fa.jpg",
      isMy: true,
    };

    dispatch(addMessage(newMessage));
  };

  useEffect(() => {
    console.log(chatLists);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-message">
      <Header />
      <div className="main">
        {chatLists.map((item, index) => (
          <Message key={item.id} user={item} />
        ))}
      </div>
      <Footer addNewMessage={addNewMessage} />
    </div>
  );
};

export default Chat;
