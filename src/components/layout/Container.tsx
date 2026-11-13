import React from "react";

export function Container({
  children,
  className = "",
  ...rest
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div {...rest} className={`mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,64px)] ${className}`}>
      {children}
    </div>
  );
}
