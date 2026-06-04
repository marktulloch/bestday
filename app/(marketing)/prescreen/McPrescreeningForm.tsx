"use client";

import { useEffect, useState } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { z } from "zod";

import { trackPrescreenEvent } from "@/lib/analytics/prescreen-events";
import { createClient } from "@/lib/supabase/client";
import {
  MC_CONTRAINDICATED_MEDICATION_OPTIONS,
  MC_NONE_OF_THE_ABOVE_MED_SLUG,
  mcPrescreeningSubmissionSchema,
} from "@/lib/validation/mc-prescreening";
import { mcPrescreenWithRegistrationSchema } from "@/lib/validation/mc-prescreen-with-registration";

import { submitMcPrescreenWithRegistration, submitMcPrescreeningResponse } from "../mc-flow/actions";

const inputCls =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4EDD00] text-sm";

type McSignedInValues = z.input<typeof mcPrescreeningSubmissionSchema>;
type McGuestValues = z.input<typeof mcPrescreenWithRegistrationSchema>;

function YesNoField<T extends FieldValues>({
  legend,
  hint,
  name,
  control,
  error,
}: {
  legend: string;
  hint?: string;
  name: Path<T>;
  control: Control<T>;
  error?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-900">{legend}</legend>
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                className="h-4 w-4 border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]"
                checked={field.value === false}
                onChange={() => field.onChange(false)}
              />
              No
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                className="h-4 w-4 border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]"
                checked={field.value === true}
                onChange={() => field.onChange(true)}
              />
              Yes
            </label>
          </div>
        )}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </fieldset>
  );
}

function ClinicalBlock<T extends McSignedInValues | McGuestValues>({
  control,
  errors,
  watch,
  setValue,
}: {
  control: Control<T>;
  errors: Partial<Record<keyof McSignedInValues, { message?: string }>>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
}) {
  const meds = (watch("contraindicated_medications" as Path<T>) as string[] | undefined) ?? [];

  function toggleMedication(slug: string, checked: boolean) {
    const current =
      (watch("contraindicated_medications" as Path<T>) as string[] | undefined) ?? [];
    const lower = slug.toLowerCase();
    let next: string[];
    if (lower === MC_NONE_OF_THE_ABOVE_MED_SLUG) {
      next = checked ? [MC_NONE_OF_THE_ABOVE_MED_SLUG] : [];
    } else {
      const withoutNone = current.filter((s) => s.toLowerCase() !== MC_NONE_OF_THE_ABOVE_MED_SLUG);
      if (checked) {
        next = [...withoutNone.filter((s) => s.toLowerCase() !== lower), slug];
      } else {
        next = withoutNone.filter((s) => s.toLowerCase() !== lower);
      }
    }
    setValue("contraindicated_medications" as Path<T>, next as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const e = errors as Record<string, { message?: string } | undefined>;

  return (
    <div className="space-y-8 border-t border-gray-100 pt-8">
      <h2 className="text-base font-semibold text-gray-900">Clinical pre-screen</h2>

      <YesNoField<T>
        control={control}
        name={"previously_attempted_treatment" as Path<T>}
        legend="Have you already tried other medical treatments for your symptoms?"
        hint="For example prescribed medicines, physiotherapy, counselling, or other therapies recommended by a clinician."
        error={e.previously_attempted_treatment?.message}
      />

      <YesNoField<T>
        control={control}
        name={"pregnant_breastfeeding_or_trying" as Path<T>}
        legend="Are you currently pregnant, breastfeeding, or trying to conceive?"
        error={e.pregnant_breastfeeding_or_trying?.message}
      />

      <YesNoField<T>
        control={control}
        name={"allergic_cannabinoids_coconut_salicylates" as Path<T>}
        legend="Do you have a known allergy to cannabinoids, coconut, or salicylates (aspirin-related medicines)?"
        error={e.allergic_cannabinoids_coconut_salicylates?.message}
      />

      <YesNoField<T>
        control={control}
        name={"psychosis_schizophrenia_bipolar_history" as Path<T>}
        legend="Have you ever been diagnosed with psychosis, schizophrenia, or bipolar disorder?"
        error={e.psychosis_schizophrenia_bipolar_history?.message}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900">
          Are you currently taking any of these medicines?
        </legend>
        <p className="text-xs text-gray-500">
          Select every medicine that applies. If none apply, choose &quot;None of the above&quot; only.
        </p>
        <div className="space-y-2 pt-1">
          {MC_CONTRAINDICATED_MEDICATION_OPTIONS.map((opt) => {
            const active = meds.some((s) => s.toLowerCase() === opt.slug.toLowerCase());
            return (
              <label
                key={opt.slug}
                className="flex items-start gap-3 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50/80"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]"
                  checked={active}
                  onChange={(ev) => toggleMedication(opt.slug, ev.target.checked)}
                />
                <span className="text-sm text-gray-800">{opt.label}</span>
              </label>
            );
          })}
        </div>
        {e.contraindicated_medications?.message ? (
          <p className="text-sm text-red-600">{e.contraindicated_medications.message}</p>
        ) : null}
      </fieldset>
    </div>
  );
}

function McPrescreenSignedInForm() {
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    trackPrescreenEvent("prescreen_mc_view", { mode: "signed_in" });
  }, []);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<McSignedInValues>({
    resolver: zodResolver(mcPrescreeningSubmissionSchema),
    defaultValues: {
      age_20_or_above: false,
      previously_attempted_treatment: false,
      pregnant_breastfeeding_or_trying: false,
      allergic_cannabinoids_coconut_salicylates: false,
      psychosis_schizophrenia_bipolar_history: false,
      contraindicated_medications: [],
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setActionError(null);
        const res = await submitMcPrescreeningResponse(data);
        if (!res.ok) {
          setActionError(res.error);
          trackPrescreenEvent("prescreen_mc_submit_error", { error: res.error });
          return;
        }
        trackPrescreenEvent("prescreen_mc_submit_ok", { eligible: res.eligible });
        if (res.eligible) {
          router.push("/prescreen/schedule");
        } else {
          router.push("/prescreen/complete?outcome=ineligible");
        }
      })}
      className="space-y-8"
    >
      {formError === "config" && (
        <p
          className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3"
          role="alert"
        >
          Pre-screening cannot be saved yet (server configuration). Please try again later or contact
          support.
        </p>
      )}
      {formError === "session" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3" role="alert">
          Your session was reset. Continue below.
        </p>
      )}
      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3" role="alert">
          {actionError}
        </p>
      )}

      <div className="space-y-3">
        <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-4">
          <input
            type="checkbox"
            {...register("age_20_or_above", {
              setValueAs: (v) => v === true || v === "on",
            })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]"
          />
          <span className="text-sm font-medium text-gray-900">
            I confirm I am <span className="whitespace-nowrap">20 years of age or older</span>.
          </span>
        </label>
        {errors.age_20_or_above && (
          <p className="text-sm text-red-600">{errors.age_20_or_above.message}</p>
        )}
      </div>

      <ClinicalBlock<McSignedInValues>
        control={control}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-[#4EDD00] text-[#0d2e0d] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3db800] hover:text-[#0d2e0d]"
      >
        {isSubmitting ? "Submitting…" : "Submit pre-screen"}
      </button>
    </form>
  );
}

function McPrescreenGuestForm() {
  const searchParams = useSearchParams();
  const formError = searchParams.get("error");
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    trackPrescreenEvent("prescreen_mc_view", { mode: "guest" });
  }, []);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<McGuestValues>({
    resolver: zodResolver(mcPrescreenWithRegistrationSchema),
    defaultValues: {
      email: "",
      confirmEmail: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      preferredName: "",
      dateOfBirth: "",
      gender: "",
      mobile: "",
      termsAccepted: false,
      privacyAccepted: false,
      previously_attempted_treatment: false,
      pregnant_breastfeeding_or_trying: false,
      allergic_cannabinoids_coconut_salicylates: false,
      psychosis_schizophrenia_bipolar_history: false,
      contraindicated_medications: [],
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setActionError(null);
        const res = await submitMcPrescreenWithRegistration(data);
        if (!res.ok) {
          setActionError(res.error);
          trackPrescreenEvent("prescreen_mc_submit_error", { error: res.error });
          return;
        }
        trackPrescreenEvent("prescreen_mc_submit_ok", { eligible: res.eligible });
        if (!res.eligible) {
          router.push("/prescreen/complete?outcome=ineligible");
          return;
        }

        const supabase = createClient();
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        });
        if (signInErr) {
          router.push("/prescreen/complete?outcome=eligible&signin=manual");
          return;
        }

        router.push("/prescreen/schedule");
      })}
      className="space-y-8"
    >
      {formError === "config" && (
        <p
          className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3"
          role="alert"
        >
          Pre-screening cannot be saved yet (server configuration). Please try again later or contact
          support.
        </p>
      )}
      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3" role="alert">
          {actionError}
        </p>
      )}

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Your details</h2>
        <p className="text-xs text-gray-500">
          We create your patient account only if you are eligible from the clinical answers below. You
          must be at least 20 years old (we verify this from your date of birth).
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ps-fn" className="block text-sm font-medium text-gray-700 mb-1">
              First name *
            </label>
            <input id="ps-fn" {...register("firstName")} className={inputCls} autoComplete="given-name" />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="ps-ln" className="block text-sm font-medium text-gray-700 mb-1">
              Last name *
            </label>
            <input id="ps-ln" {...register("lastName")} className={inputCls} autoComplete="family-name" />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="ps-pref" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="ps-pref" {...register("preferredName")} className={inputCls} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ps-dob" className="block text-sm font-medium text-gray-700 mb-1">
              Date of birth * <span className="text-gray-400 font-normal text-xs">YYYY-MM-DD</span>
            </label>
            <input id="ps-dob" type="date" {...register("dateOfBirth")} className={inputCls} />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="ps-gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <input id="ps-gender" {...register("gender")} className={inputCls} autoComplete="sex" />
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="ps-mobile" className="block text-sm font-medium text-gray-700 mb-1">
            Mobile *
          </label>
          <input id="ps-mobile" type="tel" {...register("mobile")} className={inputCls} autoComplete="tel" />
          {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>}
        </div>

        <div>
          <label htmlFor="ps-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input id="ps-email" type="email" {...register("email")} className={inputCls} autoComplete="email" />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="ps-cemail" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm email *
          </label>
          <input
            id="ps-cemail"
            type="email"
            {...register("confirmEmail")}
            className={inputCls}
            autoComplete="email"
          />
          {errors.confirmEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmEmail.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="ps-pw" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            id="ps-pw"
            type="password"
            {...register("password")}
            className={inputCls}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="ps-cpw" className="block text-sm font-medium text-gray-700 mb-1">
            Repeat password *
          </label>
          <input
            id="ps-cpw"
            type="password"
            {...register("confirmPassword")}
            className={inputCls}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
          <label className="flex gap-2 items-start text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              {...register("termsAccepted", { setValueAs: (v) => v === true || v === "on" })}
              className="mt-0.5 rounded border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]"
            />
            <span>I accept the terms of use *</span>
          </label>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
          )}
          <label className="flex gap-2 items-start text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              {...register("privacyAccepted", { setValueAs: (v) => v === true || v === "on" })}
              className="mt-0.5 rounded border-gray-300 text-[#4EDD00] focus:ring-[#4EDD00]"
            />
            <span>I accept the privacy policy *</span>
          </label>
          {errors.privacyAccepted && (
            <p className="text-sm text-red-600">{errors.privacyAccepted.message}</p>
          )}
        </div>
      </div>

      <ClinicalBlock<McGuestValues>
        control={control}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-[#4EDD00] text-[#0d2e0d] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3db800] hover:text-[#0d2e0d]"
      >
        {isSubmitting ? "Submitting…" : "Create account & submit pre-screen"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Already registered?{" "}
        <Link href="/login?next=/portal" className="font-medium text-[#3a9e00] hover:underline">
          Log in
        </Link>{" "}
        — you can submit a new pre-screen while signed in.
      </p>
    </form>
  );
}

export default function McPrescreeningForm({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) {
    return <McPrescreenSignedInForm />;
  }
  return <McPrescreenGuestForm />;
}
