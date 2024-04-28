export const getBlockPositionStyle = (idx) => {
  let style = {
    width: window.screen.width / 12,
    height: window.screen.height / 8,
  };
  if (idx > 35) {
    idx = idx % 36;
  }
  if (idx >= 0 && idx < 12) {
    style.top = style.height * 7;
    style.left = window.screen.width - style.width*(idx+1)
    style.borderLeftColor = idx === 11 ? "black" : "transparent";
    style.borderTopColor = idx === 11 || idx === 0 ? "transparent" : "black";
  } else if (idx >= 12 && idx <= 17) {
    style.left = 0;
    style.top = window.screen.height - style.height*(idx-10);
    style.borderTopColor = "transparent";
  } else if (idx >= 18 && idx <= 29) {
    style.top = 0;
    style.left = style.width*(idx - 18);
    style.borderRightColor = idx === 29 ? "black" : "transparent";
  } else if (idx >= 30) {
    style.left = window.screen.width - style.width;
    style.top = style.height*(idx - 29)
    style.borderTopColor = "transparent";
  }
  return style;
};

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));
