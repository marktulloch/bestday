import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  id?: string;
}

export default function Section({ children, id }: SectionProps) {
  return (
    <section className="py-16" id={id}>
      {children}
    </section>
  );
}
