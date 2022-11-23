import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dataAbout: {
    name: "Patricia Smith",
    gmail: "adc@gmail.com",
    time: "11:40 AM",
    location: "California, USA",
  },
};

export const profile = createSlice({
  name: "profile",
  initialState,
  reducers: {
    editProfile: (state, actions) => {
      state.dataAbout = actions.payload;
    },
  },
});

export const { editProfile } = profile.actions;

export const selectProfile = (state) => state.profile.dataAbout;

export default profile.reducer;
