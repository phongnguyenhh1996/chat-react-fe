import React, { useState } from "react";
import Dialog from "rc-dialog";
import { useDispatch } from "react-redux";

import ListBook from "./../../../Contacts/components/ListBook/index";
import { addGroup } from "../../../../features/groups/group";

import "./style.scss";

const CreateGroups = ({ isOpen, onClose, isCheckBox }) => {
  const dispatch = useDispatch();
  const [group, setGroup] = useState({
    name: "",
    email: [],
  });
  const [openContact, setOpenContact] = useState(false);

  const handleClick = () => {
    dispatch(addGroup(group));
    setGroup({ name: "", email: [] });
    onClose();
  };
  const handleOnChange = (e) => {
    const { value } = e.target;
    setGroup((group) => ({ ...group, name: value }));
  };

  const addEmail = (gmail) => {
    const emails = group.email;
    emails.push(gmail);
    setGroup((group) => ({ ...group, email: emails }));
  };

  const removeEmail = (gmail) => {
    let emails = group.email.filter((item) => item !== gmail);
    setGroup((group) => ({ ...group, email: emails }));
  };
  return (
    <Dialog
      maskAnimation="fade"
      animation="fade"
      onClose={onClose}
      title={"Create New Group"}
      visible={isOpen}
      wrapClassName="add__groups center"
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
          onClick={handleClick}
        >
          Create Group
        </button>,
      ]}
    >
      <form className="add__groups-form" action="">
        <label className="add__groups-form-title" htmlFor="">
          Group Name
        </label>
        <input
          value={group.name}
          name="name"
          onChange={handleOnChange}
          className="add__groups-form-input"
          placeholder="Enter Group Name"
        />
        <label className="add__groups-form-title" htmlFor="">
          Group Members
        </label>
        <button
          type="button"
          className="select-members"
          onClick={() => {
            setOpenContact(!openContact);
          }}
        >
          Select Members
        </button>
        {openContact && (
          <div className="add__groups-contact">
            <h4 className="add__groups-contact-title">Contacts</h4>
            <ListBook
              emails={group.email}
              addEmail={addEmail}
              removeEmail={removeEmail}
              isCheckBox={true}
              className="add__groups-contact-list"
            />
          </div>
        )}
        <label className="add__groups-form-title" htmlFor="">
          Description
        </label>
        <textarea
          className="add__groups-form-input"
          type="text"
          placeholder="Enter Description"
        />
      </form>
    </Dialog>
  );
};

export default CreateGroups;
