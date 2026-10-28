import { InquiryForm } from '../InquiryForm.js';
import { SupportIntro } from '../SupportIntro.js';
export default function ContactPage() {
  return (
    <div className="grid gap-12 py-8 md:grid-cols-2 md:py-16">
      <SupportIntro page="contact" />
      <InquiryForm category="support" />
    </div>
  );
}
