import {
  Container,
  DemoNotice,
  SectionHeading,
} from "@/components/ui/Primitives";
import { PrintingCampaign } from "@/components/campaigns/Campaigns";
import { PrintingInquiry } from "@/components/services/PrintingInquiry";

export const metadata = { title: "Custom 3D printing" };
export default function Printing() {
  return (
    <>
      <div className="campaign-page-title">
        <p className="eyebrow">HIMATU CUSTOM / YOUR NEXT CREATION</p>
        <h1>
          BRING YOUR FAVOURITE
          <br />
          CHARACTERS TO LIFE.
        </h1>
        <p className="campaign-introduction">
          Explore custom 3D printing for unique collectible creations.
        </p>
        <a className="button button--primary" href="#quotation">
          EXPLORE YOUR IDEA
        </a>
      </div>
      <PrintingCampaign
        title={
          <>
            FROM AN IDEA.
            <br />
            INTO YOUR WORLD.
          </>
        }
        href="#quotation"
        action="DESCRIBE YOUR IDEA"
      />
      <Container className="page-content">
        <section className="section service-copy">
          <p className="eyebrow">FROM CONCEPT TO COLLECTIBLE</p>
          <h2>A different dimension of collecting.</h2>
          <p>
            Custom 3D printing turns a digital design into a physical object,
            layer by layer. Explore a character concept, a display idea or a
            unique addition to your collection. Feasibility, rights, dimensions,
            materials and finish would need individual review before any project
            is accepted.
          </p>
        </section>
        <section>
          <SectionHeading
            eyebrow="THE POSSIBILITIES OF FORM"
            title="The making of a collection"
          />
          <div className="printing-gallery">
            {["Digital design", "Layer by layer", "Display planning"].map(
              (label, index) => (
                <figure key={label}>
                  <div className="printing-process-card" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                    <span>{label}</span>
                  </div>
                  <figcaption>
                    {
                      [
                        "Character form",
                        "Display composition",
                        "Collector concept",
                      ][index]
                    }{" "}
                    · process illustration
                  </figcaption>
                </figure>
              ),
            )}
          </div>
          <DemoNotice>
            Process illustrations only. These are not photographs of completed
            printing projects or verified production capabilities.
          </DemoNotice>
        </section>
        <section className="section">
          <SectionHeading title="How an idea takes shape" />
          <div className="process-grid">
            {[
              [
                "01",
                "Share your idea",
                "Describe the character, scale and intended display.",
              ],
              [
                "02",
                "Explore the possibilities",
                "A future consultation would confirm feasibility, rights and specifications.",
              ],
              [
                "03",
                "Review a proposal",
                "Materials, finish, pricing and timing would need approval before production.",
              ],
            ].map(([number, title, body]) => (
              <article key={number}>
                <p className="step-label">{number}</p>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="custom-options">
          <h2>Make it personal.</h2>
          <p>
            Use the inquiry preview to describe preferred dimensions, pose,
            display arrangement and finish. These are discussion prompts, not a
            promise that every option can be produced.
          </p>
        </section>
        <PrintingInquiry />
        <section className="service-faq">
          <SectionHeading title="Before you begin" />
          {[
            [
              "Can I upload a reference?",
              "Yes. In this preview, JPEG, PNG and WebP files up to 5 MB can be selected and previewed locally. Nothing is uploaded.",
            ],
            [
              "Which materials and sizes are available?",
              "Materials, dimensions and production options have not been confirmed. Each future project would need a feasibility review.",
            ],
            [
              "How much does a custom creation cost?",
              "No pricing or turnaround time is confirmed. This form does not request or generate a real quote.",
            ],
            [
              "Can any character be printed?",
              "Any future project would need a review of design suitability and applicable intellectual property rights.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </Container>
    </>
  );
}
