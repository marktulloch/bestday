import { ReactNode } from "react";

interface BoxProps {
  children: ReactNode;
  className?: string;
}

export default function Box({ children, className = "" }: BoxProps) {
  return <div className={className}>{children}</div>;
}
