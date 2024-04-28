import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  section: "Chats",
  contactList: [
    {
      email: "Albert Rodarte",
      name: "Allsion Etter",
    },
    {
      email: "allsion_etter@gamil.com",
      name: "Allsion Etter",
    },
  ],
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    changeSection: (state, action) => {
      state.section = action.payload;
    },
  },
});

export const { changeSection } = uiSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectSection = (state) => state.ui.section;

export default uiSlice.reducer;
