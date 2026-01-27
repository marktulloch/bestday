import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
}

export default function Card({ children }: CardProps) {
  return (
    <div className="rounded-xl bg-brand-yellowSoft border border-border-subtle p-8">
      {children}
    </div>
  );
}
