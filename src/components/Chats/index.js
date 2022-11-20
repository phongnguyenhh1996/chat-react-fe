import React from "react";
import { CiSearch } from "react-icons/ci";
import ScrollContainer from "react-indiana-drag-scroll";
import { onSearch, selectChatList } from "../../features/chats/chat";
import Avatar from "../Avatar";
import ChatList from "./ChatLists";

import "./style.scss";
import { useSelector, useDispatch } from "react-redux";

export const Chats = () => {
  const dispatch = useDispatch();
  const chatList = useSelector(selectChatList);
  const handleSearch = (e) => {
    dispatch(onSearch(e.target.value));
  };
  return (
    <div className="chats__all">
      <h4 className="chats__all_section">Chats</h4>
      <div className="chats__all_search">
        <span>
          <CiSearch />
        </span>
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Search messages or users"
        />
      </div>
      <div className="chats__all_online">
        <ul className="list__online">
          <ScrollContainer
            className="scroll-container"
            horizontal={true}
            hideScrollbars={true}
          >
            {chatList.map((data, index) => (
              <li className="user__online" key={index}>
                <div className="user__online-lider">
                  <Avatar
                    className="avatar-lider"
                    isOnline={true}
                    img={data.avatar}
                  />
                  <h5 className="name__online">{data.name.split(" ")[0]}</h5>
                </div>
              </li>
            ))}
          </ScrollContainer>
        </ul>
      </div>
      <ChatList />
    </div>
  );
};
