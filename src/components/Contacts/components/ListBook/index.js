import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import Dropdown from "rc-dropdown";

import {
  selectContact,
  removeContact,
  selectSearch,
} from "../../../../features/contacts/contact";
import DropDown from "../../../DropDown";
import { dataCheck } from "./dataCheck";

import "./style.scss";

const ListBook = () => {
  const dispatch = useDispatch();
  const contact = useSelector(selectContact);
  const search = useSelector(selectSearch);
  const onSelect = (type, email) => {
    if (type !== "Remove") return;

    dispatch(removeContact(email));
  };

  let filteredContact = contact.filter((data) =>
    data.name.toLowerCase().includes(search.toLowerCase())
  );

  const contactByAlphabet = {};

  filteredContact.sort((a, b) => {
    if (a.name.toUpperCase() < b.name.toUpperCase()) {
      return -1;
    }
    if (a.name.toUpperCase() > b.name.toUpperCase()) {
      return 1;
    }
    return 0;
  });

  filteredContact.forEach((contact) => {
    const firstLetter = contact.name[0].toUpperCase();
    if (contactByAlphabet[firstLetter]) {
      contactByAlphabet[firstLetter].push(contact);
    } else {
      contactByAlphabet[firstLetter] = [contact];
    }
  });

  return (
    <div className="list__book">
      <div className="list__book-item">
        {Object.keys(contactByAlphabet).map((alphabet) => (
          <React.Fragment key={alphabet}>
            <div className="list__book-title">{alphabet}</div>
            <ul className="list__book-name">
              {contactByAlphabet[alphabet].map((data, idx) => (
                <li className="name__contacts" key={idx}>
                  <h4 className="name__contacts-text">{data.name}</h4>
                  <div>
                    <Dropdown
                      trigger={["click"]}
                      overlay={
                        <DropDown
                          className="dropdown__user-item"
                          options={dataCheck.map((item, idx) =>
                            item === "Divider" ? (
                              item
                            ) : (
                              <div
                                className="name__contacts-item"
                                onClick={() => onSelect(item.title, data.email)}
                                key={idx}
                              >
                                <p>{item.title}</p>
                                {item.icon && <item.icon />}
                              </div>
                            )
                          )}
                        />
                      }
                      animation="slide-up"
                      onVisibleChange={"onVisibleChange"}
                      overlayClassName={"dropdown__user"}
                    >
                      <FiMoreVertical className="name__contacts-icon" />
                    </Dropdown>
                  </div>
                </li>
              ))}
            </ul>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ListBook;
