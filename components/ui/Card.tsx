import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border-subtle bg-brand-yellowSoft p-8 ${className}`}
    >
      {children}
    </div>
  );
}
