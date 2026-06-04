"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle(index);
    }
  };

  return (
    <dl className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border-b border-gray-200 pb-4">
          <dt>
            <button
              type="button"
              onClick={() => handleToggle(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
              className="w-full text-left flex items-center justify-between py-2 focus:outline-none focus:ring-2 focus:ring-[#4EDD00] focus:ring-offset-2 rounded"
            >
              <span className="font-medium text-lg">{item.question}</span>
              <span className="text-[#4EDD00] text-xl font-semibold ml-4">
                {openIndex === index ? "−" : "+"}
              </span>
            </button>
          </dt>
          <dd
            id={`faq-answer-${index}`}
            className={`overflow-hidden ${openIndex === index ? "max-h-96 mt-2" : "max-h-0"}`}
          >
            <p className="text-gray-700">{item.answer}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
