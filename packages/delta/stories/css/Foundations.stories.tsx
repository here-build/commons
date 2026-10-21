import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import styles from "./test.module.css";
import "../../src/index.css";
import { Chroma } from "@here.build/delta/chroma";

const meta = {
  title: "Delta CSS/Foundations",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["snapshot"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConstraintMathematics: Story = {
  name: "Constraint Mathematics",
  render: () => (
    <div className="Δvertical Δlayout" style={{ padding: "calc(var(--⚙️grid-step) * 8)" }}>
      <h1 style={{ fontSize: "2em", margin: "0 0 1em 0" }}>
        Delta Constraint Mathematics
      </h1>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Emphasis × Variant Matrix
        </h2>

        <div className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 2)" }}>
          {["neutral", "accent", "brand", "danger", "warning", "success"].map((emphasis) => (
            <div key={emphasis} className="Δvertical Δlayout">
              <div style={{ fontSize: "0.875em", fontWeight: "600", textTransform: "uppercase" }}>
                {emphasis} Emphasis
              </div>

              <div className="Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 2)" }}>
                {[
                  { variant: "ghost", classes: "Δaction" },
                  { variant: "outlined", classes: "Δaction Δbordered" },
                  { variant: "filled", classes: "Δaction Δfilled" },
                  { variant: "card", classes: "Δdisplay Δbordered Δfilled" },
                ].map(({ variant, classes }) => (
                  <div
                    key={variant}
                    className={`${classes} Δemphasis-${emphasis} Δdensity-medium`}
                    style={{
                      width: 120,
                      height: 60,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875em",
                    }}
                  >
                    {variant}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Density Scale
        </h2>

        <div className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 2)" }}>
          {["compact", "small", "medium", "large", "spacious"].map((density) => (
            <div key={density} className="Δvertical Δlayout">
              <div style={{ fontSize: "0.875em", fontWeight: "600", textTransform: "uppercase" }}>
                {density} Density
              </div>

              <div className={`Δlayout Δdensity-${density}`}>
                <div className="Δaction Δfilled Δemphasis-accent">Action</div>
                <div className="Δaction Δbordered Δemphasis-neutral">Outlined</div>
                <div className="Δaction Δemphasis-brand">Ghost</div>
                <div className="Δdisplay Δbordered Δemphasis-neutral">Display</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Interactive States
        </h2>

        <div className="Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 2)" }}>
          <div className="Δaction Δfilled Δemphasis-accent Δdensity-medium">Normal</div>
          <div className="Δaction Δfilled Δemphasis-accent Δdensity-medium Δis-hover">Hover</div>
          <div className="Δaction Δfilled Δemphasis-accent Δdensity-medium Δis-active">Active</div>
          <div className="Δaction Δfilled Δemphasis-accent Δdensity-medium Δis-disabled">Disabled</div>
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Surface Hierarchy
        </h2>

        <div className="Δsurface Δsurface-canvas" style={{ padding: "var(--gap-y) var(--gap-x)" }}>
          <div style={{ marginBottom: "var(--gap-y)" }}>Canvas Surface</div>
          <div className="Δsurface Δsurface-base" style={{ padding: "var(--gap-y) var(--gap-x)" }}>
            <div style={{ marginBottom: "var(--gap-y)" }}>Base Surface</div>
            <div className="Δsurface Δsurface-raised" style={{ padding: "var(--gap-y) var(--gap-x)" }}>
              Raised Surface
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const LayoutMathematics: Story = {
  name: "Layout Mathematics",
  render: () => (
    <div className="Δvertical Δlayout" style={{ padding: "calc(var(--⚙️grid-step) * 8)" }}>
      <h1 style={{ fontSize: "2em", margin: "0 0 1em 0" }}>
        Layout Mathematics
      </h1>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Δlayout: Horizontal Flow
        </h2>

        <div className="Δsurface Δbordered" style={{ padding: "var(--gap-y) var(--gap-x)" }}>
          <div style={{ fontSize: "0.875em", marginBottom: "var(--gap-y)" }}>
            Default layout (gap = line-height)
          </div>
          <div className="Δlayout">
            <div className="Δaction Δbordered Δdensity-medium" style={{ width: 60, height: 60 }}>A</div>
            <div className="Δaction Δbordered Δdensity-medium" style={{ width: 60, height: 60 }}>B</div>
            <div className="Δaction Δbordered Δdensity-medium" style={{ width: 60, height: 60 }}>C</div>
          </div>
        </div>

        <div className="Δsurface Δbordered" style={{ padding: "var(--gap-y) var(--gap-x)" }}>
          <div style={{ fontSize: "0.875em", marginBottom: "var(--gap-y)" }}>
            Grouped layout (tight spacing)
          </div>
          <div className="Δlayout Δgroup">
            <div className="Δaction Δfilled Δemphasis-accent">One</div>
            <div className="Δaction Δfilled Δemphasis-accent">Two</div>
            <div className="Δaction Δfilled Δemphasis-accent">Three</div>
          </div>
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Δvertical: Vertical Flow
        </h2>

        <div className="Δsurface Δbordered" style={{ padding: "var(--gap-y) var(--gap-x)", width: "300px" }}>
          <div className="Δvertical Δlayout">
            <div style={{ fontSize: "1.125em", fontWeight: "600" }}>Card Title</div>
            <div>This demonstrates vertical layout with mathematical spacing relationships.</div>
            <div className="Δlayout">
              <div className="Δaction Δfilled Δemphasis-accent">Primary</div>
              <div className="Δaction Δbordered Δemphasis-neutral">Secondary</div>
            </div>
          </div>
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Δstack: Layered Positioning
        </h2>

        <div className="Δstack" style={{ width: 200, height: 120 }}>
          <div className="Δsurface Δsurface-base Δbordered" style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            Base Layer
          </div>
          <div style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 1
          }}>
            <div className="Δdisplay Δfilled Δemphasis-danger" style={{
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75em"
            }}>
              3
            </div>
          </div>
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          CSS Modules Test
        </h2>

        <div className={styles.testModule}>
          <div className={styles.highlight}>CSS Modules Working!</div>
          <div>This demonstrates that CSS modules are properly configured and scoped.</div>
        </div>
      </section>

      <section className="Δvertical Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 4)" }}>
        <h2 style={{ fontSize: "1.5em", margin: "0" }}>
          Chroma Color Utility Test
        </h2>

        <div className="Δlayout" style={{ gap: "calc(var(--⚙️grid-step) * 2)" }}>
          {[
            { name: "Base", color: new Chroma("#3b82f6") },
            { name: "Lighter", color: new Chroma("#3b82f6").lighten(20) },
            { name: "Darker", color: new Chroma("#3b82f6").darken(20) },
            { name: "Rotated", color: new Chroma("#3b82f6").rotate(120) },
          ].map(({ name, color }) => (
            <div
              key={name}
              style={{
                backgroundColor: color.hex(),
                color: color.getContrast("#ffffff") > 4.5 ? "#ffffff" : "#000000",
                padding: "calc(var(--⚙️grid-step) * 2)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
                minWidth: "80px"
              }}
            >
              <div style={{ fontWeight: "600" }}>{name}</div>
              <div style={{ fontSize: "0.75em", opacity: 0.8 }}>{color.hex()}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: "0.875em", color: "var(--color-text-low)" }}>
          Chroma utility demonstrates programmatic color manipulation integrated with Delta design system.
        </div>
      </section>
    </div>
  ),
};
