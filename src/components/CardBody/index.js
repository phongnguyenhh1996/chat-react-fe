import React from "react";
import { RiEditFill } from "react-icons/ri";
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
    <div className="card__body">
      {props.isEdit ? (
        <div>
          <button>
            <RiEditFill />
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
  );
};

export default CardBody;
