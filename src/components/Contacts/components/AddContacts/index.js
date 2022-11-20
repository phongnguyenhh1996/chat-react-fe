import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Dialog from "rc-dialog";

import { addContact } from "../../../../features/contacts/contact";

import "./style.scss";

const AddContacts = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [contactData, setContactData] = useState({ email: "", name: "" });
  const [error, setError] = useState({});

  const handleClick = () => {
    if (Object.values(error).join("") !== "") return;

    dispatch(addContact(contactData));
    setContactData({ email: "", name: "" });
    setError({});
    onClose();
  };
  const handleOnChange = (e) => {
    const newContactData = contactData;
    const { name, value } = e.target;
    newContactData[name] = value;
    setContactData(newContactData);
    checkValid(newContactData);
  };

  const checkValid = (data) => {
    const regEmail = /\S+@\S+\.\S+/;
    const newError = error;
    if (!regEmail.test(data.email)) {
      newError.email = "Email is not correct";
    } else {
      newError.email = "";
    }
    if (data.name.length < 1) {
      newError.name = "Please enter your name";
    } else {
      newError.name = "";
    }

    setError((error) => ({ ...error, ...newError }));
  };

  return (
    <Dialog
      maskAnimation="fade"
      animation="fade"
      onClose={onClose}
      title={"Add Contacts"}
      visible={isOpen}
      wrapClassName="add__contacts center"
    >
      <form className="add__contacts-form" action="">
        <label className="add__contacts-form-title" htmlFor="">
          Name
        </label>
        <input
          name="name"
          onChange={handleOnChange}
          value={contactData.name}
          className="add__contacts-form-input"
          type="email"
          placeholder="Enter Name"
        />
        <span className="error">{error.name}</span>
        <label className="add__contacts-form-title" htmlFor="">
          Email
        </label>
        <input
          value={contactData.email}
          name="email"
          onChange={handleOnChange}
          className="add__contacts-form-input"
          type="text"
          placeholder="Enter Email"
        />
        <span className="error">{error.email}</span>
        <label className="add__contacts-form-title" htmlFor="">
          Invatation Message
        </label>
        <textarea
          className="add__contacts-form-input"
          type="text"
          placeholder="Enter Message"
        />
      </form>
      <div className="add__contacts-footer">
        <button className="footer-btn btn-close">Close</button>
        <button onClick={handleClick} className="footer-btn btn-invite">
          Add Contact
        </button>
      </div>
    </Dialog>
  );
};

export default AddContacts;
