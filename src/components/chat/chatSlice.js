import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  listMessage: [
    {
      id: "1",
      textMessage: [{ text: "hello hieu", time: "10:11" }],
      nameUser: "beautiful  girl",
      imageUser:
        "http://chatvia-light.react.themesbrand.com/static/media/avatar-4.b23e41d9c09997efbc21.jpg",
      isMy: false,
    },
    {
      id: "2",
      textMessage: [{ text: "hello beautiful  girl", time: "10:11" }],
      nameUser: "hieu",
      imageUser:
        "http://chatvia-light.react.themesbrand.com/static/media/avatar-7.5ba5195e48f4c2c3c3fa.jpg",
      isMy: true,
    },
  ],
};

export const chatSlice = createSlice({
  name: "chatSlice",
  initialState,
  reducers: {
    addMessage: (state, { payload }) => {
      const isMy = state.listMessage[state.listMessage.length - 1].isMy;
      if (isMy) {
        state.listMessage[state.listMessage.length - 1].textMessage.push({
          text: payload.textMessage,
          time: payload.time,
        });
      }
    },
  },
});

export const { addMessage } = chatSlice.actions;

export const chatList = (state) => state.chatSlice.listMessage;

export default chatSlice.reducer;
