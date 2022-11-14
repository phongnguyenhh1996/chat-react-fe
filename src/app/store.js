import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../features/counter/counterSlice";
import uiReducer from './../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    ui: uiReducer
  },
});
