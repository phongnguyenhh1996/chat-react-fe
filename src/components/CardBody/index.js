import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RiEditFill } from "react-icons/ri";
import { Scrollbars } from "react-custom-scrollbars-2";

import EditUser from "./components/EditUser";
import { selectProfile } from "./../../features/profile/profile";

import "./style.scss";

const CardBody = (props) => {
  const [isOpen, setOpen] = useState(false);
  const dataAbout = useSelector(selectProfile);

  return (
    <Scrollbars autoHeight autoHeightMax={200} autoHide autoHideDuration={200}>
      <div className="card__body">
        {props.isEdit ? (
          <>
            <div className="card__body-edit">
              <button className="btn-edit" onClick={() => setOpen(true)}>
                <RiEditFill className="icon-edit" />
                Edit
              </button>
            </div>
            <EditUser isOpen={isOpen} onClose={() => setOpen(false)} />
          </>
        ) : (
          <div></div>
        )}
        <>
          <div className="card__body-item">
            <p className="card__body-title">Name</p>
            <h5 className="card__body-name">{dataAbout.name}</h5>
          </div>
          <div className="card__body-item">
            <p className="card__body-title">Gmail</p>
            <h5 className="card__body-name">{dataAbout.gmail}</h5>
          </div>
          <div className="card__body-item">
            <p className="card__body-title">Time</p>
            <h5 className="card__body-name">{dataAbout.time}</h5>
          </div>
          <div className="card__body-item">
            <p className="card__body-title">Location</p>
            <h5 className="card__body-name">{dataAbout.location}</h5>
          </div>
        </>
      </div>
    </Scrollbars>
  );
};

export default CardBody;
