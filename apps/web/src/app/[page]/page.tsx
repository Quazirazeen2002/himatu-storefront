import { ContactForm } from "@/components/services/ContactForm";
import { notFound } from "next/navigation";
import { information } from "@/lib/config";
import { Container, ButtonLink } from "@/components/ui/Primitives";
import { AboutPage } from "@/components/campaigns/AboutPage";
import type { Metadata } from "next";
export function generateStaticParams() { return Object.keys(information).map(page => ({page})); }
export async function generateMetadata({params}:{params:Promise<{page:string}>}):Promise<Metadata> { const {page}=await params; return { title: page === "about" ? "About HIMATU" : information[page]?.title || "HIMATU" }; }
export default async function Info({params}:{params:Promise<{page:string}>}) {
  const {page}=await params;
  const content=information[page];
  if(!content)notFound();
  if(page==="about") return <AboutPage />;
  return <Container className="info-page"><p className="eyebrow">HIMATU / {page.replaceAll("-"," ")}</p><h1>{content.title}</h1><p className="info-body">{content.body}</p>
    {page==="contact" && <ContactForm />}
    {page==="faqs" && <section className="info-details">{[
      ["How do I place an order?","Add your selections to the bag, create an account or sign in, and complete your delivery details. Submit your order request securely on the website and choose your preferred contact channel. HIMATU will review the items and contact you to confirm pricing, delivery and payment details. Sending a separate chat message is optional."],
      ["Will my favourites be saved?","Your bag, wishlist and recently viewed selections are saved in this browser when storage is available. Clearing site data removes those browser selections."],
      ["Can I check availability?","Stock labels reflect available units for products managed in our catalogue. For items marked for enquiry, ask HIMATU about availability before ordering."],
      ["Can I request custom 3D printing?","Use the 3D printing page to submit your project details and reference images. Sign in to track your request and review quotations."],
      ["How do I get help with delivery or returns?","Contact HIMATU on WhatsApp at 01714546809 with the product or order details so our team can help."],
    ].map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>}
    {page==="privacy" && <section className="info-details"><h2>Your information and your choices.</h2><p>Account forms send your registration and sign-in details to our account service. Checkout uses your contact details and delivery address to handle your order. Printing enquiries can include project details and uploaded reference images. The website also records shopping interaction events to help us understand product interest.</p><p>Your browser stores your bag, wishlist, recently viewed items and theme preference. You can remove these through your browser’s site-data settings. Order requests are stored so HIMATU can review and follow up on your selection. If you choose to share the optional order details through a social app, that platform processes the message under its own privacy terms.</p><p>For questions about your account or information, contact HIMATU at 01714546809. Do not send passwords or payment credentials in enquiries.</p></section>}
    {page==="terms" && <section className="info-details"><h2>Review. Confirm. Collect.</h2><p>Check the product, quantity, delivery details and displayed total before submitting. Submitting a request does not make a payment or confirm fulfilment. HIMATU will contact you to confirm the order and delivery arrangements.</p><p>Availability enquiries and custom printing requests require a response from HIMATU. Agree on the exact item or project, delivery arrangements and payment method with our team before paying.</p></section>}
    {page==="shipping-returns" && <section className="info-details"><h2>Before your collectible arrives.</h2><p>Choose the delivery option appropriate to your address at checkout. The final service, delivery charge and dispatch timing depend on the item and destination. HIMATU can confirm these details with your order.</p><p>For a delivery issue, damaged item or return enquiry, contact HIMATU with your order details and relevant photographs. Ask our team about the applicable conditions for your item.</p></section>}
    <ButtonLink href="/shop" variant="outline">EXPLORE THE COLLECTION</ButtonLink>
  </Container>;
}
