import { BLOCKS, COLUMNS, ROWS } from "./constants";

export const getBlockPositionStyle = (idx) => {
  const offset = {
    width: document.getElementsByClassName("container-page")[0]?.offsetWidth,
    height: document.getElementsByClassName("container-page")[0]?.offsetHeight,
  };
  let style = {
    width: offset.width / ROWS,
    height: offset.height / COLUMNS,
  };
  if (idx > BLOCKS.length - 1) {
    idx = idx % BLOCKS.length;
  }
  const block = BLOCKS[idx];
  if (block.position === "bottom") {
    style.top = style.height * (COLUMNS - 1);
    style.left = offset.width - style.width * (idx + 1);
    style.borderLeftColor = idx === ROWS - 1 ? "black" : "transparent";
    style.borderTopColor =
      idx === ROWS - 1 || idx === 0 ? "transparent" : "black";
  } else if (block.position === "left") {
    style.left = 0;
    style.top = offset.height - style.height * (idx - COLUMNS);
    style.borderTopColor = "transparent";
  } else if (block.position === "top") {
    style.top = 0;
    style.left = style.width * (idx - ROWS - COLUMNS + 2);
    style.borderRightColor =
      idx === ROWS + COLUMNS * 2 - 1 ? "black" : "transparent";
  } else if (block.position === "right") {
    style.left = offset.width - style.width;
    style.top = style.height * (idx - (ROWS + COLUMNS * 2 - 1));
    style.borderTopColor = "transparent";
  }
  return style;
};

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));
