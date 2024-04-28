import React, { useState } from "react";
import Dialog from "rc-dialog";
import { useSelector, useDispatch } from "react-redux";
import {
  editProfile,
  selectProfile,
} from "./../../../../features/profile/profile";

const EditUser = ({ isOpen, onClose }) => {
  const dataAbout = useSelector(selectProfile);
  const [edit, setEdit] = useState(dataAbout);
  const dispatch = useDispatch();

  const handleEdit = (e) => {
    const newData = { ...edit };
    newData[e.target.name] = e.target.value;
    setEdit(newData);
  };

  const handleSubmit = () => {
    dispatch(editProfile(edit));
    onClose();
  };

  return (
    <Dialog
      maskAnimation="fade"
      animation="fade"
      onClose={onClose}
      title={"Edit User"}
      visible={isOpen}
      wrapClassName="add__contacts center"
      footer={[
        <button
          type="button"
          className="btn btn-default footer-btn btn-close"
          key="close"
          onClick={onClose}
        >
          Close
        </button>,
        <button
          type="button"
          className="btn btn-primary footer-btn btn-invite"
          key="save"
          onClick={handleSubmit}
        >
          Save Edit
        </button>,
      ]}
    >
      <form className="add__contacts-form" action="">
        <label className="add__contacts-form-title" htmlFor="">
          Name
        </label>
        <input
          onChange={handleEdit}
          value={edit.name}
          name="name"
          className="add__contacts-form-input"
          type="email"
          placeholder="Enter Name"
        />

        <label className="add__contacts-form-title" htmlFor="">
          Email
        </label>
        <input
          onChange={handleEdit}
          value={edit.gmail}
          name="gmail"
          className="add__contacts-form-input"
          type="text"
          placeholder="Enter Email"
        />
        <label className="add__contacts-form-title" htmlFor="">
          Location
        </label>
        <input
          onChange={handleEdit}
          value={edit.location}
          name="location"
          className="add__contacts-form-input"
          type="text"
          placeholder="Enter Location"
        />
      </form>
    </Dialog>
  );
};

export default EditUser;
