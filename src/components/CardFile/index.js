import Dropdown from "rc-dropdown";
import React from "react";
import { AiTwotoneFileZip } from "react-icons/ai";
import { BsCardImage } from "react-icons/bs";
import { FiMoreVertical } from "react-icons/fi";
import { RiDownload2Line } from "react-icons/ri";
import { dataFile } from "./dataFile";
import "./style.scss";
import Menu, { Item as MenuItem, Divider } from "rc-menu";

const imgExt = ["jpg", "svg", "png", "webp"];

const menu = ["Action", "Another Action", "Divider", "Delete"];

const dropDownMenu = (
  <Menu>
    {menu.map((item, idx) =>
      item === "Divider" ? (
        <Divider key={idx} />
      ) : (
        <MenuItem key={idx}>
          <div className="dropdown__item">{item}</div>
        </MenuItem>
      )
    )}
  </Menu>
);

const CardFile = () => {
  return (
    <div className="card__body card__file">
      {dataFile.map((data, idx) => (
        <div className="card__file-item" key={idx}>
          {imgExt.includes(data.title.split(".").pop()) ? (
            <div className="card__file-img">
              <BsCardImage className="img-icon" />
            </div>
          ) : (
            <div className="card__file-img">
              <AiTwotoneFileZip className="img-icon" />
            </div>
          )}
          <div className="card__file-content">
            <h5 className="card__file-title">{data.title}</h5>
            <p className="card__file-size">{data.size}</p>
          </div>
          <RiDownload2Line className="card__file-down" />
          <Dropdown
            trigger={["click"]}
            overlay={dropDownMenu}
            animation="slide-up"
            onVisibleChange={"onVisibleChange"}
            overlayClassName={"dropdown"}
          >
            <FiMoreVertical />
          </Dropdown>
        </div>
      ))}
    </div>
  );
};

export default CardFile;
