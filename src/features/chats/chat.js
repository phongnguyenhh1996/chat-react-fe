import { createSlice } from "@reduxjs/toolkit";

import AvtChart from "../../asset/img/avatar_chat.jpg";

const initialState = {
  chatList: [
    {
      name: "Patrick Hendricks",
      avatar: AvtChart,
      time: "02:50",
      message: "how i am",
    },
    {
      name: "Mark Messer",
      avatar: AvtChart,
      time: "10:30",
      message: "how i am",
    },
    {
      name: "General",
      avatar: AvtChart,
      time: "02:06",
      message: "how i am",
    },
    {
      name: "Doris Brown",
      avatar: AvtChart,
      time: "02:50",
      message: "how i am",
    },
    {
      name: "Designer",
      avatar: AvtChart,
      time: "02:50",
      message: "how i am",
    },
    {
      name: "Steve Walker",
      avatar: AvtChart,
      time: "02:50",
      message: "how i am",
    },
    {
      name: "Albert Rodarte",
      avatar: AvtChart,
      time: "02:50",
      message: "how i am",
    },
    {
      name: "Patrick Hendricks",
      avatar: AvtChart,
      time: "02:50",
      message: "how i am",
    },
    {
      name: "Patrick Hendricks",
      avatar: AvtChart,
      time: "02:50",
      message: "how i am",
    },
    {
      name: "Patrick Hendricks",
      avatar: AvtChart,
      time: "02:50",
      message: "how i am",
    },
  ],
  search: "",
};

export const chat = createSlice({
  name: "chat",
  initialState,
  reducers: {
    onSearch: (state, action) => {
      state.search = action.payload;
    },
  },
});

export const { onSearch } = chat.actions;

export const selectChatList = (state) => state.chat.chatList;
export const selectSearch = (state) => state.chat.search;
export default chat.reducer;
