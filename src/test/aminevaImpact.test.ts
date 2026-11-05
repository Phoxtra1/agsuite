import { describe, it, expect } from "vitest";
import {
  FOCUS_AREAS,
  INITIATIVES,
  COLLABORATION_CATEGORIES,
  IMPACT_INTRO,
} from "../data/impact";

describe("Amineva Impact Data Layer", () => {
  it("defines the introductory positioning of Amineva Impact", () => {
    expect(IMPACT_INTRO.headline).toBeDefined();
    expect(IMPACT_INTRO.positioning).toContain("Amineva Impact represents Amineva Global");
    });

  it("contains all broad focus areas", () => {
    expect(FOCUS_AREAS.length).toBeGreaterThanOrEqual(6);
    const titles = FOCUS_AREAS.map((f) => f.title);
    expect(titles).toContain("Education & Educational Development");
    expect(titles).toContain("Career Awareness & Exploration");
    expect(titles).toContain("Youth Empowerment & Skills Development");
    expect(titles).toContain("Mentorship & Professional Exposure");
    expect(titles).toContain("Community Development");
    expect(titles).toContain("Social & Developmental Initiatives");
  });

  it("features Career Development & Exploration as the first active initiative", () => {
    const careerDev = INITIATIVES.find((i) => i.id === "career-development");
    expect(careerDev).toBeDefined();
    expect(careerDev?.status).toBe("active");
    expect(careerDev?.title).toBe("Career Development & Exploration Initiative");
    expect(careerDev?.objectives.length).toBeGreaterThan(0);
    expect(careerDev?.targetAudience.length).toBeGreaterThan(0);
    expect(careerDev?.activities.length).toBeGreaterThan(0);
  });

  it("supports initiative statuses (active, completed, planned)", () => {
    INITIATIVES.forEach((init) => {
      expect(["active", "completed", "planned"]).toContain(init.status);
    });
  });

  it("includes documented school engagements with verified figures", () => {
    const careerDev = INITIATIVES.find((i) => i.id === "career-development");
    expect(careerDev?.schoolEngagements).toBeDefined();
    expect(careerDev?.schoolEngagements?.length).toBeGreaterThan(0);
    const engagement = careerDev?.schoolEngagements?.[0];
    expect(engagement?.beneficiariesCount).toBe(1000);
    expect(engagement?.topicsCovered.length).toBeGreaterThan(0);
  });

  it("contains institutional collaboration categories and contact links", () => {
    expect(COLLABORATION_CATEGORIES.length).toBeGreaterThan(0);
    COLLABORATION_CATEGORIES.forEach((cat) => {
      expect(cat.title).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(cat.examples.length).toBeGreaterThan(0);
    });
  });
});
