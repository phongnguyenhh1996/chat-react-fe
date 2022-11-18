import Dropdown from "rc-dropdown";
import React from "react";
import { AiTwotoneFileZip } from "react-icons/ai";
import { BsCardImage } from "react-icons/bs";
import { FiMoreVertical } from "react-icons/fi";
import { RiDownload2Line } from "react-icons/ri";
import { dataFile } from "./dataFile";
import "./style.scss";
import { Scrollbars } from "react-custom-scrollbars-2";
import DropDown from "../../../DropDown";

const imgExt = ["jpg", "svg", "png", "webp"];

const menu = ["Action", "Another Action", "Divider", "Delete"];

const CardFile = () => {
  return (
    <Scrollbars autoHeight autoHeightMax={200} autoHide autoHideDuration={200}>
      <div className="card__body card__file">
        {dataFile.map((data, idx) => (
          <div className="card__file-item" key={idx}>
            <div className="card__file-img">
              {imgExt.includes(data.title.split(".").pop()) ? (
                <BsCardImage className="img-icon" />
              ) : (
                <AiTwotoneFileZip className="img-icon" />
              )}
            </div>
            <div className="card__file-content">
              <h5 className="card__file-title">{data.title}</h5>
              <p className="card__file-size">{data.size}</p>
            </div>
            <RiDownload2Line className="card__file-down" />
            <Dropdown
              trigger={["click"]}
              overlay={<DropDown options={menu} />}
              animation="slide-up"
              onVisibleChange={"onVisibleChange"}
              overlayClassName={"dropdown"}
            >
              <FiMoreVertical />
            </Dropdown>
          </div>
        ))}
      </div>
    </Scrollbars>
  );
};

export default CardFile;
