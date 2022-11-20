import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  contactList: [
    {
      email: "albert_rodarte@gmail.com",
      name: "Phong",
    },
    {
      email: "allsion_etter@gmail.com",
      name: "Allsion Etter",
    },
  ],
  search: "",
};

export const contact = createSlice({
  name: "contact",
  initialState,
  reducers: {
    addContact: (state, action) => {
      state.contactList.push(action.payload);
    },
    removeContact: (state, action) => {
      state.contactList = state.contactList.filter(
        (contact) => contact.email !== action.payload
      );
    },
    onSearch: (state, action) => {
      state.search = action.payload;
    },
  },
});

export const { addContact, removeContact, onSearch } = contact.actions;

export const selectContact = (state) => state.contact.contactList;
export const selectSearch = (state) => state.contact.search;
export default contact.reducer;
