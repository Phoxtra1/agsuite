import { describe, it, expect } from "vitest";
import {
  FOCUS_AREAS,
  INITIATIVES,
  COLLABORATION_CATEGORIES,
  IMPACT_INTRO,
  SCHOOL_ACTIVITY_IMAGES,
} from "../data/impact";

describe("Amineva Impact Data Layer", () => {
  it("defines the current introductory positioning of Amineva Impact", () => {
    expect(IMPACT_INTRO.headline).toBe("A social initiative of Amineva Global");
    expect(IMPACT_INTRO.positioning).toContain(
      "Amineva Impact is a social initiative of Amineva Global"
    );
    expect(IMPACT_INTRO.mission).toBeTruthy();
  });

  it("contains the current broad focus areas", () => {
    const titles = FOCUS_AREAS.map((area) => area.title);
    expect(titles).toHaveLength(6);
    expect(titles).toContain("Career Development and Exploration");
    expect(titles).toContain("Youth Empowerment and Skills Development");
    expect(titles).toContain("Mentorship and Professional Exposure");
    expect(titles).toContain("Community Development");
    expect(titles).toContain("Social Development Initiatives");
    expect(titles).toContain("Education and Educational Development");
  });

  it("features Career Development and Exploration as the first active programme", () => {
    const careerDev = INITIATIVES.find((initiative) => initiative.id === "career-development");
    expect(careerDev).toBeDefined();
    expect(careerDev?.status).toBe("active");
    expect(careerDev?.title).toBe("Career Development and Exploration Program");
    expect(careerDev?.objectives.length).toBeGreaterThan(0);
    expect(careerDev?.targetAudience.length).toBeGreaterThan(0);
    expect(careerDev?.activities.length).toBeGreaterThan(0);
  });

  it("supports initiative statuses (active, completed, planned)", () => {
    INITIATIVES.forEach((initiative) => {
      expect(["active", "completed", "planned"]).toContain(initiative.status);
    });
  });

  it("includes documented school engagements with verified figures", () => {
    const careerDev = INITIATIVES.find((initiative) => initiative.id === "career-development");
    expect(careerDev?.schoolEngagements).toBeDefined();
    expect(careerDev?.schoolEngagements?.length).toBeGreaterThan(0);

    const engagement = careerDev?.schoolEngagements?.[0];
    expect(engagement?.beneficiariesCount).toBe("600+");
    expect(engagement?.topicsCovered.length).toBeGreaterThan(0);
    expect(engagement?.schoolName).toBe("School Engagement");
    expect(
      careerDev?.verifiedMetrics?.find((metric) => metric.label === "Schools Engaged")?.figure
    ).toBe("5");
    expect(SCHOOL_ACTIVITY_IMAGES).toHaveLength(8);

    const photoUrls = SCHOOL_ACTIVITY_IMAGES.map((photo) => photo.url);
    expect(photoUrls).toContain("/images/impact/IMG_20261028_084846.jpg");
    expect(photoUrls).toContain("/images/impact/IMG_20261028_084908.jpg");
    expect(photoUrls).toContain("/images/impact/IMG_20261028_090003.jpg");
    expect(photoUrls).toContain("/images/impact/IMG_20261028_090243.jpg");
    expect(photoUrls).not.toContain("/eduu.png");
    expect(photoUrls).not.toContain("/images/impact/impact-school-engagement.webp");
  });

  it("contains institutional collaboration categories and contact links", () => {
    expect(COLLABORATION_CATEGORIES.length).toBeGreaterThan(0);
    COLLABORATION_CATEGORIES.forEach((category) => {
      expect(category.title).toBeTruthy();
      expect(category.description).toBeTruthy();
      expect(category.examples.length).toBeGreaterThan(0);
    });
  });
});
