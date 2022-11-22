import Tooltip from "rc-tooltip";
import { useDispatch } from "react-redux";
import React, { useState } from "react";
import { BiGroup } from "react-icons/bi";
import { CiSearch } from "react-icons/ci";

import CreateGroups from "./components/CreateGroups";
import ListGroup from "./components/ListGroups";

import "./style.scss";
import { onSearch } from "../../features/groups/group";

const Groups = () => {
  const dispatch = useDispatch();
  const [isOpen, setOpen] = useState(false);
  const handleSearch = (e) => {
    dispatch(onSearch(e.target.value));
  };

  return (
    <div className="groups">
      <div className="groups__title">
        <h4 className="groups__title-text">Groups</h4>
        <Tooltip
          placement="bottom"
          trigger={"hover"}
          overlay={<span>Create Groups</span>}
          overlayClassName={"over over-contacts"}
          mouseLeaveDelay={0.1}
        >
          <button className="groups__title-icon" onClick={() => setOpen(true)}>
            <BiGroup />
          </button>
        </Tooltip>
        <CreateGroups isOpen={isOpen} onClose={() => setOpen(false)} />
      </div>
      <div className="groups__search">
        <span>
          <CiSearch />
        </span>
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Search groups.."
        />
      </div>
      <ListGroup />
    </div>
  );
};
export default Groups;
