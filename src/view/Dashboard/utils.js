export const getBlockPositionStyle = (idx) => {
    if (idx > 35) {
    idx = idx % 36;
  }
  const rect = document.getElementById(`block-${idx}`)?.getBoundingClientRect() || {}
  
  const style = {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left
  };

  // if (idx >= 0 && idx < 12) {
  //   style.top = style.height * 7;
  //   style.left = offset.width - style.width*(idx+1)
  //   style.borderLeftColor = idx === 11 ? "black" : "transparent";
  //   style.borderTopColor = idx === 11 || idx === 0 ? "transparent" : "black";
  // } else if (idx >= 12 && idx <= 17) {
  //   style.left = 0;
  //   style.top = offset.height - style.height*(idx-10);
  //   style.borderTopColor = "transparent";
  // } else if (idx >= 18 && idx <= 29) {
  //   style.top = 0;
  //   style.left = style.width*(idx - 18);
  //   style.borderRightColor = idx === 29 ? "black" : "transparent";
  // } else if (idx >= 30) {
  //   style.left = offset.width - style.width;
  //   style.top = style.height*(idx - 29)
  //   style.borderTopColor = "transparent";
  // }
  return style;
};

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));
