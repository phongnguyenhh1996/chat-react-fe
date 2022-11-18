import React from "react";
import { useSelector } from "react-redux";
import { selectSection } from "../../features/ui/uiSlice";

import { Chats } from "../chats";

import { Setting } from "../Settings/index";
import { Profile } from "./../Profile/index";
import Contacts from "./../Contacts/index";
import { Groups } from "./../Groups/index";

export const Section = () => {
  const section = useSelector(selectSection);
  const sections = () => {
    switch (section) {
      case "Profile":
        return <Profile />;
      case "Chats":
        return <Chats />;
      case "Groups":
        return <Groups />;
      case "Contacts":
        return <Contacts />;
      case "Settings":
        return <Setting />;
      default:
        break;
    }
  };
  return (
    <>
      <div className="section">{sections()}</div>
    </>
  );
};
