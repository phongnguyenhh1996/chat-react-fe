import { configureStore } from "@reduxjs/toolkit";

import counterReducer from "../features/counter/counterSlice";
import uiReducer from "./../features/ui/uiSlice";
import contact from "./../features/contacts/contact";
import chat from "./../features/chats/chat";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    ui: uiReducer,
    contact,
    chat,
  },
});
