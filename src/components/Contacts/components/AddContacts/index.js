import React, { useState } from "react";
import "./style.scss";
import Dialog from "rc-dialog";
import { useDispatch } from "react-redux";
import { addContact } from "../../../../features/contacts/contact";

const AddContacts = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [contactData, setContactData] = useState({ email: "", name: "" });
  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setContactData({ ...contactData, [name]: value });
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
          Email
        </label>
        <input
          name="email"
          onChange={handleOnChange}
          className="add__contacts-form-input"
          type="text"
          placeholder="Enter Email"
        />
        <label className="add__contacts-form-title" htmlFor="">
          Name
        </label>
        <input
          name="name"
          onChange={handleOnChange}
          className="add__contacts-form-input"
          type="text"
          placeholder="Enter Name"
        />
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
        <button
          onClick={() => {
            dispatch(addContact(contactData));
            onClose();
          }}
          className="footer-btn btn-invite"
        >
          Add Contact
        </button>
      </div>
    </Dialog>
  );
};

export default AddContacts;
