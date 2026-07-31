import React from "react";
import logoImg from "@/assets/5363874353084309359.jpg";

export const LoveVapeLogo = ({ className = "h-9 w-auto" }: { className?: string }) => {
  return <img src={logoImg} alt="LoveVape" className={className} />;
};
