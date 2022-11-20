import React from "react";

import { RiEditFill } from "react-icons/ri";
import { Scrollbars } from "react-custom-scrollbars-2";

import { dataAbout } from "./dataAbout";

import "./style.scss";

const CardItem = ({ data }) => {
  return (
    <div className="card__body-item">
      <p className="card__body-title">{data.title}</p>
      <h5 className="card__body-name">{data.name}</h5>
    </div>
  );
};

const CardBody = (props) => {
  return (
    <Scrollbars autoHeight autoHeightMax={200} autoHide autoHideDuration={200}>
      <div className="card__body">
        {props.isEdit ? (
          <div className="card__body-edit">
            <button className="btn-edit">
              <RiEditFill className="icon-edit" />
              Edit
            </button>
          </div>
        ) : (
          <div></div>
        )}
        {dataAbout.map((data, idx) => (
          <CardItem key={idx} data={data} />
        ))}
      </div>
    </Scrollbars>
  );
};

export default CardBody;
