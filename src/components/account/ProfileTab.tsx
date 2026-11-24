import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, LifeBuoy } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { COUNTRY_OPTIONS, validateProfileInput } from '../../lib/account/accountHelpers';
import { updateUserProfile } from '../../lib/data/repository';
import type { Profile } from '../../lib/data/types';
import { Button, Input, Select, TagPill, Tile, useToast } from '../primitives';

export interface ProfileTabProps {
  user: User;
  profile: Profile | null;
  onProfileUpdated: () => Promise<void>;
}

/**
 * Profile Tab:
 * - Edits strictly `display_name` and `country_code` on `profiles` table.
 * - Email is read-only from Google OAuth (`auth.user.email`).
 * - Links to `/support` for data or account assistance (no "Delete my data" control).
 */
export function ProfileTab({ user, profile, onProfileUpdated }: ProfileTabProps) {
  const { toast } = useToast();

  const initialName = profile?.display_name ?? '';
  const initialCountry = (profile?.country_code ?? '').toUpperCase();

  const [displayName, setDisplayName] = useState(initialName);
  const [countryCode, setCountryCode] = useState(initialCountry);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    countryCode?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setCountryCode((profile?.country_code ?? '').toUpperCase());
  }, [profile?.display_name, profile?.country_code]);

  const isDirty =
    displayName.trim() !== initialName.trim() ||
    countryCode.trim().toUpperCase() !== initialCountry.trim().toUpperCase();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSavedFlag(false);

    const validated = validateProfileInput({ displayName, countryCode });
    setFieldErrors(validated.fieldErrors);
    if (!validated.valid) return;

    setSaving(true);
    const res = await updateUserProfile(user.id, {
      display_name: validated.displayName,
      country_code: validated.countryCode,
    });
    setSaving(false);

    if (!res.ok) {
      setSaveError(res.error || "We couldn't save your profile changes. Please try again.");
      return;
    }

    await onProfileUpdated();
    setSavedFlag(true);
    toast({
      title: 'Profile updated',
      description: 'Your account details have been saved.',
      tone: 'success',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* Main Profile Form (7 cols desktop) */}
      <Tile variant="white" radius="xl" padding="lg" className="lg:col-span-7 flex flex-col gap-5">
        <div>
          <TagPill>Profile details</TagPill>
          <h2 className="type-h3 font-semibold text-ink mt-2">Personal information</h2>
          <p className="text-sm text-ink-2 mt-1">
            Update the name shown on your account and your billing country preference.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email address"
            type="email"
            value={user.email ?? ''}
            readOnly
            disabled
            hint="Managed by your Google sign-in and cannot be changed here."
          />

          <Input
            label="Display name"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setSavedFlag(false);
              if (fieldErrors.displayName) {
                setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
              }
            }}
            maxLength={80}
            error={fieldErrors.displayName}
            hint="Shown in the header and on your account overview."
          />

          <Select
            label="Country"
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value);
              setSavedFlag(false);
              if (fieldErrors.countryCode) {
                setFieldErrors((prev) => ({ ...prev, countryCode: undefined }));
              }
            }}
            options={[...COUNTRY_OPTIONS]}
            error={fieldErrors.countryCode}
            hint="Optional. Stored as a standard two-letter country code."
          />

          {saveError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[16px] bg-error-bg text-error px-3.5 py-2.5 text-xs leading-relaxed"
            >
              <AlertCircle size={15} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{saveError}</span>
            </div>
          )}

          {savedFlag && !isDirty && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-[16px] bg-success-bg text-success px-3.5 py-2.5 text-xs font-medium"
            >
              <CheckCircle2 size={15} strokeWidth={1.75} aria-hidden="true" />
              <span>All changes saved.</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={saving}
              disabled={!isDirty || saving}
            >
              Save changes
            </Button>
            {isDirty && !saving && (
              <Button
                type="button"
                variant="quiet"
                size="md"
                onClick={() => {
                  setDisplayName(initialName);
                  setCountryCode(initialCountry);
                  setFieldErrors({});
                  setSaveError(null);
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </Tile>

      {/* Support & Account Assistance Tile (5 cols desktop) */}
      <Tile variant="stone" radius="xl" padding="lg" className="lg:col-span-5 flex flex-col gap-4">
        <div className="w-11 h-11 rounded-full bg-surface border border-line text-ink inline-flex items-center justify-center">
          <LifeBuoy size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h3 className="type-h3 font-semibold text-ink">Account &amp; data help</h3>
          <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">
            Need help with a receipt, licence transfer, privacy question, or account request? Reach
            our team directly through support.
          </p>
        </div>
        <div className="pt-1 flex flex-col items-start gap-3">
          <Button variant="primary" size="md" to="/support">
            <span>Contact support</span>
            <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
          </Button>
          <p className="text-xs text-ink-2">
            Direct email:{' '}
            <a
              href="mailto:heyarkvoid@gmail.com"
              className="text-brand-deep underline underline-offset-2"
            >
              heyarkvoid@gmail.com
            </a>
          </p>
        </div>
      </Tile>
    </div>
  );
}
