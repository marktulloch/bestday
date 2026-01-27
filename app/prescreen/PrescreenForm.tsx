"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitPrescreen } from "./actions";

const prescreenSchema = z.object({
  ageRange: z.string().min(1, "Please select an age range"),
  nzResident: z.boolean(),
  consultationReason: z.string().min(1, "Please select a consultation reason"),
  hasGP: z.boolean(),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must provide consent to continue",
  }),
});

type PrescreenFormData = z.infer<typeof prescreenSchema>;

export default function PrescreenForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PrescreenFormData>({
    resolver: zodResolver(prescreenSchema),
  });

  const onSubmit = async (data: PrescreenFormData) => {
    await submitPrescreen();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-6">
        <p className="text-sm text-gray-600">Step 1 of 2</p>
      </div>

      <div>
        <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700 mb-2">
          Age Range
        </label>
        <select
          id="ageRange"
          {...register("ageRange")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
        >
          <option value="">Select age range</option>
          <option value="18-25">18-25</option>
          <option value="26-35">26-35</option>
          <option value="36-45">36-45</option>
          <option value="46-55">46-55</option>
          <option value="56-65">56-65</option>
          <option value="66+">66+</option>
        </select>
        {errors.ageRange && (
          <p className="mt-1 text-sm text-red-600">{errors.ageRange.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register("nzResident")}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            I am a New Zealand resident
          </span>
        </label>
      </div>

      <div>
        <label htmlFor="consultationReason" className="block text-sm font-medium text-gray-700 mb-2">
          Consultation Reason
        </label>
        <select
          id="consultationReason"
          {...register("consultationReason")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
        >
          <option value="">Select reason</option>
          <option value="general">General consultation</option>
          <option value="follow-up">Follow-up consultation</option>
          <option value="prescription">Prescription request</option>
          <option value="other">Other</option>
        </select>
        {errors.consultationReason && (
          <p className="mt-1 text-sm text-red-600">{errors.consultationReason.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register("hasGP")}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            I have a regular GP
          </span>
        </label>
      </div>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register("consent")}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            I consent to proceed with the consultation
          </span>
        </label>
        {errors.consent && (
          <p className="mt-1 text-sm text-red-600">{errors.consent.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-[#0F3D2E] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0C3326]"
      >
        Continue
      </button>
    </form>
  );
}
