import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Icon } from "@/components/ui/Icon";
import type { GuestDetails } from "@/store/useBookingStore";

const guestSchema = z.object({
  name: z.string().min(2, "Please add your full name"),
  email: z.string().email("That email doesn't look right"),
  phone: z.string().min(7, "Please add a phone number we can reach you at"),
});

export type GuestErrors = Partial<Record<keyof GuestDetails, string>>;

/** Zod validation shared with the confirm action in BookingPage. */
export function validateGuest(value: GuestDetails): GuestErrors {
  const res = guestSchema.safeParse(value);
  if (res.success) return {};
  const errors: GuestErrors = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0] as keyof GuestDetails;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

interface GuestDetailsFormProps {
  value: GuestDetails;
  errors: GuestErrors;
  onChange: (patch: Partial<GuestDetails>) => void;
  saveDetails: boolean;
  onToggleSave: (save: boolean) => void;
}

/** Guest details step (booking mockup): name/email/phone + optional requests. */
export function GuestDetailsForm({ value, errors, onChange, saveDetails, onToggleSave }: GuestDetailsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Who's ordering?</h2>
        <div className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            placeholder="e.g. Penelope Sprinkle"
            autoComplete="name"
            value={value.name}
            error={errors.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="sweetness@bakery.com"
            autoComplete="email"
            icon="mail"
            value={value.email}
            error={errors.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="(555) 000-0000"
            autoComplete="tel"
            icon="phone"
            value={value.phone}
            error={errors.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
          <Textarea
            label="Special Requests (Optional)"
            name="specialRequests"
            rows={3}
            placeholder="Allergies, high chairs, or birthday surprises!"
            value={value.specialRequests}
            onChange={(e) => onChange({ specialRequests: e.target.value })}
          />

          {/* Save details checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <label className="relative flex items-center justify-center">
              <input
                type="checkbox"
                name="saveDetails"
                checked={saveDetails}
                onChange={(e) => onToggleSave(e.target.checked)}
                className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-on-surface bg-surface-white transition-all duration-200 checked:bg-primary"
              />
              <Icon
                name="check"
                size="sm"
                className="pointer-events-none absolute text-surface-white opacity-0 transition-opacity peer-checked:opacity-100"
              />
              <span className="sr-only">Save my details for faster treats next time</span>
            </label>
            <span className="cursor-pointer font-body-md leading-tight text-on-surface" onClick={() => onToggleSave(!saveDetails)}>
              Save my details for faster treats next time! ✨
            </span>
          </div>
        </div>
      </div>

      {/* Decorative doodle break */}
      <div aria-hidden="true" className="flex justify-center gap-8 py-4 opacity-40">
        <Icon name="bakery_dining" size="lg" className="text-primary" />
        <Icon name="celebration" size="lg" className="text-secondary" />
        <Icon name="cake" size="lg" className="text-tertiary" />
      </div>
    </div>
  );
}
