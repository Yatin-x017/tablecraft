/**
 * Static legal content (Privacy Policy / Terms of Use) — kept separate from
 * the LegalPage component so App.tsx can pass the data eagerly while the
 * page component itself is lazy-loaded (code splitting).
 */

export interface LegalSection {
  heading: string;
  body: string;
}

export const privacySections: LegalSection[] = [
  {
    heading: "Information We Collect",
    body: "We collect only what's needed to run a reservation: your name, email, phone number, party size, and optional special requests. If you choose to create an account, we store your login details via our authentication provider (Supabase Auth) and any details you save for faster rebooking.",
  },
  {
    heading: "How We Use Your Information",
    body: "Your information is used to confirm, manage, and remind you about your reservation, and to process cancellations and reschedules you request via the secure links in your confirmation email. We do not sell or rent your personal information to anyone.",
  },
  {
    heading: "Service Providers",
    body: "We rely on a small set of processors to run the site: Supabase (hosting, database, authentication, and file storage) and EmailJS (transactional email delivery). Each processes data only to provide its service and is bound by its own privacy commitments.",
  },
  {
    heading: "Cookies",
    body: "Essential cookies keep the site functional, including your sign-in session. Non-essential cookies (analytics and social embeds) are only stored if you accept them via the consent banner. You can change your preference at any time by clearing your browser data.",
  },
  {
    heading: "Your Rights",
    body: "You may request access to, correction of, or deletion of your personal data at any time by contacting us. We fulfill deletion requests manually via our admin tools — just email us and we'll take it from there.",
  },
  {
    heading: "Contact",
    body: "Questions about this policy? Email us at hello@crumbandconfetti.example or call (555) 010-2026.",
  },
];

export const termsSections: LegalSection[] = [
  {
    heading: "Acceptance of Terms",
    body: "By using this website, you agree to these Terms of Use. If you do not agree, please discontinue use of the site. These terms are template content provided for demonstration and require review by the business owner's counsel before the site is used for a real business.",
  },
  {
    heading: "Reservations",
    body: "Reservations are confirmed instantly and are subject to availability. Parties larger than our maximum seating capacity should contact us directly. You may cancel or reschedule through the secure link in your confirmation email.",
  },
  {
    heading: "No-Show Policy",
    body: "We understand plans change. While we do not charge no-show fees at this time, repeated no-shows may affect future reservation eligibility. Large-party deposits, if introduced, will be communicated at the time of booking.",
  },
  {
    heading: "Intellectual Property",
    body: "All content on this site — text, imagery, illustrations, and branding — is the property of the site owner unless otherwise noted and may not be reproduced without permission.",
  },
  {
    heading: "Limitation of Liability",
    body: "This site is provided 'as is'. To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the site or our services.",
  },
  {
    heading: "Changes to These Terms",
    body: "We may update these terms from time to time. Continued use of the site after changes constitutes acceptance of the revised terms.",
  },
];
