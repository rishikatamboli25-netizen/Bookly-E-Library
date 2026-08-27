import React from "react";

const Boutton_one = ({
  text,
  icone,
  hoverBg = "",
  hoverText = "",
  hoverBorder = "",
  width = "w-auto",
  height = "h-9",
  bg = "bg-[#F8FAFC]",
  textColor = "text-[#0F172A]",
  textSize = "text-[clamp(10px,2vw,15px)]",
  borderaddius = "rounded-lg",
  px = "px-3",
  py = "py-1",
  border = "border-2 border-[#E2E8F0]",
  
}) => {
  return (
    <button
      className={`flex items-center justify-center gap-2 ${width} ${height} ${bg} ${textColor} ${textSize} ${borderaddius} ${px} ${py} ${border} ${hoverBg} ${hoverText} ${hoverBorder}`}
    >
      {icone}
      <span>{text}</span>
    </button>
  );
};

export default Boutton_one;
