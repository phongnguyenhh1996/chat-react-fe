import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../features/counter/counterSlice";
import uiReducer from "./../features/ui/uiSlice";
import chatSlice from "./../components/chat/chatSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    ui: uiReducer,
    chatSlice,
  },
});
