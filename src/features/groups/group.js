import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  groupList: [
    {
      name: "General",
      email: ["Chien", "Phong", "Hieu"],
    },
    {
      name: "Reproting",
      email: ["Duy", "Tuan", "Thanh"],
    },
  ],

  search: "",
};

export const group = createSlice({
  name: "groups",
  initialState,
  reducers: {
    addGroup: (state, action) => {
      state.groupList.push(action.payload);
    },

    onSearch: (state, action) => {
      state.search = action.payload;
    },
  },
});

export const { addGroup, onSearch } = group.actions;

export const selectGroup = (state) => state.groups.groupList;
export const selectSearch = (state) => state.groups.search;
export default group.reducer;
