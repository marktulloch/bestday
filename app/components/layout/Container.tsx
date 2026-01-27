import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 w-full">
      {children}
    </div>
  );
}
