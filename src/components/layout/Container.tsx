import React from "react";

export function Container({
  children,
  className = "",
  ...rest
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div {...rest} className={`mx-auto w-full max-w-6xl px-6 md:px-10 ${className}`}>
      {children}
    </div>
  );
}
