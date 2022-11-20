import { useState } from "react";

import Tooltip from "rc-tooltip";
import React from "react";
import { CiSearch } from "react-icons/ci";
import { RiUserAddLine } from "react-icons/ri";
import ListBook from "./components/ListBook";
import "./style.scss";
import "rc-dialog/assets/index.css";
import AddContacts from "./components/AddContacts";
import { onSearch } from "./../../features/contacts/contact";
import { useDispatch } from "react-redux";

const Contacts = () => {
  const [isOpen, setOpen] = useState(false);
  const dispatch = useDispatch();
  const handleSearch = (e) => {
    dispatch(onSearch(e.target.value));
  };

  return (
    <div className="contacts">
      <div className="contacts__title">
        <h4 className="contacts__title-text">Contacts</h4>
        <Tooltip
          placement="bottom"
          trigger={"hover"}
          overlay={<span>Add Contacts</span>}
          overlayClassName={"over over-contacts"}
          mouseLeaveDelay={0.1}
        >
          <button
            className="contacts__title-icon"
            onClick={() => setOpen(true)}
          >
            <RiUserAddLine />
          </button>
        </Tooltip>
        <AddContacts isOpen={isOpen} onClose={() => setOpen(false)} />
      </div>
      <div className="contacts__search">
        <span>
          <CiSearch />
        </span>
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Search users.."
        />
      </div>
      <ListBook />
    </div>
  );
};

export default Contacts;
