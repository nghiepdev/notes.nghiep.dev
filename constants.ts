export const META_TITLE = `The simplest way to keep text notes. Light, clean, {and free.}`;

export const META_DESCRIPTION =
  'This free online allows you to create notes. No Ads, no sign up, no monitoring, nothing. Free forever. Never expired.';

export const EXPIRE_IN: {label: string; value: number}[] = [
  {
    label: 'Never expired',
    value: -1,
  },
  {
    label: 'Expire in 10 Minutes',
    value: 10 * 60,
  },
  {
    label: 'Expire in 30 Minutes',
    value: 30 * 60,
  },
  {
    label: 'Expire in 1 Hour',
    value: 1 * 60 * 60,
  },
  {
    label: 'Expire in 1 Day',
    value: 1 * 24 * 60 * 60,
  },
  {
    label: 'Expire in 1 Week',
    value: 1 * 7 * 24 * 60 * 60,
  },
  {
    label: 'Expire in 1 Month',
    value: 1 * 30 * 24 * 60 * 60,
  },
  {
    label: 'Expire in 6 Months',
    value: 6 * 30 * 24 * 60 * 60,
  },
  {
    label: 'Expire in 1 Year',
    value: 12 * 30 * 24 * 60 * 60,
  },
];
