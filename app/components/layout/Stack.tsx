import { ReactNode } from "react";

interface StackProps {
  children: ReactNode;
  gap?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const gapClasses = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

export default function Stack({ children, gap = "md", className = "" }: StackProps) {
  return (
    <div className={`flex flex-col ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}
