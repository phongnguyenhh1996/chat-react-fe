import React from "react";
import { useSelector } from "react-redux";
import { selectSection } from "../../features/ui/uiSlice";
import { Profile } from "./../profile/Profile";
import { Chats } from "./../chats/Chats";
import { Groups } from "./../groups/Groups";
import Contacts from "./../contacts/Contacts";
import { Setting } from "./../settings/Setting";

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
  return <>{sections()}</>;
};
