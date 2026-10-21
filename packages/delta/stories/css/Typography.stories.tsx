import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import "../../src/index.css";

const meta = {
  title: "Delta CSS/Typography",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["snapshot"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypographicScale: Story = {
  name: "Typographic Scale",
  render: () => (
    <div className="Δvertical Δlayout" style={{ padding: "calc(var(--⚙️grid-step) * 8)" }}>
      <h1 style={{ fontSize: "2em", margin: "0 0 1em 0" }}>
        Typography Mathematics
      </h1>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Hierarchical Scale
        </h2>

        <div className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 2)" }}>
          <div className="Δtext Δrole-display Δhierarchy-1">
            Display Hierarchy 1 - Primary Headlines
          </div>
          <div className="Δtext Δrole-display Δhierarchy-2">
            Display Hierarchy 2 - Section Headers
          </div>
          <div className="Δtext Δrole-display Δhierarchy-3">
            Display Hierarchy 3 - Subsection Headers
          </div>
          <div className="Δtext Δrole-display Δhierarchy-4">
            Display Hierarchy 4 - Minor Headers
          </div>
          <div className="Δtext Δrole-body">
            Body text for long-form reading content. This demonstrates the optimal sizing for paragraph text
            that maintains readability across different screen sizes and contexts.
          </div>
          <div className="Δtext Δrole-ui">
            UI text for interface elements like buttons, labels, and controls.
          </div>
          <div className="Δtext Δrole-caption">
            Caption text for supporting information, metadata, and secondary details.
          </div>
          <div className="Δtext Δrole-code">
            Code text with monospace font for technical content
          </div>
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Text Importance Levels
        </h2>

        <div className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 2)" }}>
          <div className="Δtext Δrole-body Δimportance-high">
            High importance text draws attention and indicates critical information.
          </div>
          <div className="Δtext Δrole-body Δimportance-normal">
            Normal importance text is the default for most content and interface elements.
          </div>
          <div className="Δtext Δrole-body Δimportance-low">
            Low importance text provides supporting information without competing for attention.
          </div>
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Mathematical Line Height
        </h2>

        <div className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 2)" }}>
          <div>
            <div style={{ fontSize: "0.875em", fontWeight: "600", marginBottom: "var(--gap-y)" }}>
              Body Text (Optimal Line Height)
            </div>
            <div className="Δtext Δrole-body">
              The reciprocal line height formula ensures that smaller text gets proportionally more
              line height for better readability, while larger text tightens appropriately to prevent
              excessive spacing. This mathematical relationship maintains perceptual consistency across
              all font sizes and creates natural reading rhythm.
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.875em", fontWeight: "600", marginBottom: "var(--gap-y)" }}>
              Caption Text (Increased Line Height)
            </div>
            <div className="Δtext Δrole-caption">
              Caption text demonstrates increased line height at small sizes, making it easier to read
              despite the reduced font size. The system automatically calculates the optimal spacing
              based on mathematical relationships rather than arbitrary values.
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.875em", fontWeight: "600", marginBottom: "var(--gap-y)" }}>
              Display Text (Tighter Line Height)
            </div>
            <div className="Δtext Δrole-display Δhierarchy-2">
              Large display text automatically tightens its line height to maintain visual balance
              and prevent excessive spacing that would break the reading flow.
            </div>
          </div>
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Text in Different Contexts
        </h2>

        <div className="Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
          <div className="Δdisplay Δbordered Δfilled Δemphasis-neutral" style={{
            padding: "var(--gap-y) var(--gap-x)",
            maxWidth: "300px"
          }}>
            <div className="Δvertical Δlayout">
              <div className="Δtext Δrole-ui Δimportance-high">Card Title</div>
              <div className="Δtext Δrole-body">
                Text within containers automatically adapts to the context while maintaining
                mathematical relationships.
              </div>
              <div className="Δtext Δrole-caption Δimportance-low">
                Metadata or supporting information
              </div>
            </div>
          </div>

          <div className="Δaction Δfilled Δemphasis-accent Δdensity-medium" style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--gap-y) var(--gap-x)"
          }}>
            <div className="Δtext Δrole-ui">Button Text</div>
          </div>
        </div>
      </section>
    </div>
  ),
};
