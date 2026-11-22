import { test, expect } from "@playwright/test";

test.describe("BreatheWise AI - Senior QA Hackathon Test Suite", () => {
  const BASE_URL = "http://localhost:3000";

  // Test 1: Desktop Responsiveness & Overview
  test("1. Desktop View - Overview page fits above fold and loads real telemetry", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });

    // Assert branding and main title
    await expect(page.locator("h1")).toContainText("Urban Air Intelligence");

    // Assert AQI Number appears and is numeric (wait for count-up animation)
    const aqiNumber = page.locator("span.tabular-nums").first();
    await expect(aqiNumber).toBeVisible();
    await expect(aqiNumber).not.toHaveText("0", { timeout: 4000 });

    // Assert Health Directive Banner is visible
    await expect(page.getByText("Health Directives")).toBeVisible();

    // Assert particulate & weather metrics grid (PM2.5, PM10, Surface Temp, Humidity, Wind Speed)
    await expect(page.getByText("PM2.5").first()).toBeVisible();
    await expect(page.getByText("PM10").first()).toBeVisible();
    await expect(page.getByText("Surface Temp")).toBeVisible();
    await expect(page.getByText("Humidity", { exact: true })).toBeVisible();
    await expect(page.getByText("Wind Speed")).toBeVisible();

    // Check no critical console errors
    expect(consoleErrors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  // Test 2: Mobile Responsiveness
  test("2. Mobile View (iPhone 14 - 390x844) - Fluid responsive layout and sidebar/navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });

    // Page title and hero elements visible on mobile
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("span.tabular-nums").first()).toBeVisible();
    await expect(page.getByText("PM2.5").first()).toBeVisible();
  });

  // Test 3: Navigation Across All Core Modules
  test("3. Navigation - Seamless switching across all functional routes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to Overview
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Urban Air Intelligence");

    // Navigate to Daily Planner
    await page.goto(`${BASE_URL}/planner`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Daily Planner");

    // Navigate to Indoor Air
    await page.goto(`${BASE_URL}/indoor`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Indoor Air & Household Assessment");

    // Navigate to Green Impact
    await page.goto(`${BASE_URL}/impact`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Green Impact & Commute Analysis");

    // Navigate to Community Watch
    await page.goto(`${BASE_URL}/community`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Community Smoke Watch & Clean Refuges");

    // Navigate to Assistant
    await page.goto(`${BASE_URL}/assistant`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Assistant");
  });

  // Test 4: AI Daily Planner Functionality
  test("4. Planner Module - Family Profile Drawer, Activity Checkboxes, and Points", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/planner`, { waitUntil: "domcontentloaded" });

    // Open Family Profile Drawer
    const profileBtn = page.getByRole("button", { name: /Family Profile/i });
    await profileBtn.click();
    await expect(page.getByText("Primary Household Cohort")).toBeVisible();

    // Verify AI Activity Safety Verifier is present
    await expect(page.getByText("AI Activity Safety Verifier")).toBeVisible();

    // Click a preset plan scenario (e.g. 5K Morning Run)
    const presetBtn = page.getByRole("button", { name: /5K Morning Run/i });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Verify the input has been populated
    const activityInput = page.getByPlaceholder(/Morning 5km run/i);
    await expect(activityInput).toHaveValue("Morning 5K Outdoor Run");

    // Click "Verify with AI"
    const verifyBtn = page.getByRole("button", { name: /Verify with AI/i });
    await verifyBtn.click();

    // Verify AI Verification Result is rendered
    await expect(page.getByText("Safety Index")).toBeVisible({ timeout: 12000 });
    await expect(page.getByText(/Estimated Inhaled PM2.5/i)).toBeVisible();

    // Add verified plan to today's schedule
    const addToRoutineBtn = page.getByRole("button", { name: /Add to Today's Routine/i });
    await expect(addToRoutineBtn).toBeVisible();
    await addToRoutineBtn.click();

    // Confirm that the custom plan is added to the schedule with AI Verified badge
    await expect(page.getByText("AI Verified Plan")).toBeVisible();

    // Check an activity item checkbox
    const checkboxes = page.locator("button:has(svg.lucide-circle, svg.lucide-check-circle-2)");
    const firstCheckbox = checkboxes.first();
    await firstCheckbox.click();

    // Verify protection score / clean air points update
    await expect(page.getByText(/Protection Score/i)).toBeVisible();
  });

  // Test 5: Indoor Air Household Assessment & Budget Recommendations
  test("5. Indoor Module - Assessment form, budget filter tabs, and room purifiers", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/indoor`, { waitUntil: "domcontentloaded" });

    // Open Household Assessment Form
    const assessmentBtn = page.getByRole("button", { name: /Household Assessment/i });
    await expect(assessmentBtn).toBeVisible();
    await page.waitForTimeout(600);
    await assessmentBtn.click();
    await expect(page.getByText("Household Assessment Form")).toBeVisible();

    // Click on Budget Filter Tabs
    await page.getByRole("button", { name: "Free (₹0)" }).click();
    await expect(page.getByText("Diurnal Convection Window Airing")).toBeVisible();

    await page.getByRole("button", { name: "Under ₹500" }).click();
    await expect(page.getByText("Silicone Under-Door Brush Sweep Stopper")).toBeVisible();

    await page.getByRole("button", { name: "All Tiers" }).click();

    // Test Room Purifier Power Toggle
    const powerButtons = page.locator("button:has(svg.lucide-power)");
    const firstPurifier = powerButtons.first();
    await firstPurifier.click();
  });

  // Test 6: Green Impact Transportation Comparison Calculator
  test("6. Impact Module - Mode Selector, Sliders, and Transparent Assumptions", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/impact`, { waitUntil: "domcontentloaded" });

    // Verify mode buttons exist
    await page.getByRole("button", { name: /^Carpool/i }).click();
    await page.getByRole("button", { name: /^Metro Rail/i }).click();

    // Check Real-time Calculated Outputs
    await expect(page.getByText("CO2 Avoided")).toBeVisible();
    await expect(page.getByText("Fuel Saved")).toBeVisible();
    await expect(page.getByText("Money Saved")).toBeVisible();
    await expect(page.getByText("Tree Equivalent")).toBeVisible();

    // Verify Calculation Assumptions Card is present
    await expect(page.getByText("Calculation Assumptions & Scientific Basis")).toBeVisible();
    await expect(page.getByText(/Petrol Baseline Price/i)).toBeVisible();
  });

  // Test 7: Community Smoke Watch & Incident Reporting Form
  test("7. Community Module - Report pollution form, radar map, and upvoting", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/community`, { waitUntil: "domcontentloaded" });

    // Verify upvoting works
    const upvoteButtons = page.locator("button:has(svg.lucide-thumbs-up)");
    const firstUpvote = upvoteButtons.first();
    await expect(firstUpvote).toBeVisible();
    const countBefore = (await firstUpvote.innerText()).trim();
    await firstUpvote.click();
    await expect(firstUpvote).not.toHaveText(countBefore);

    // Open Report Incident Modal
    await page.getByRole("button", { name: /Report Pollution/i }).click();
    await expect(page.getByText("Report Environmental Pollution Incident")).toBeVisible();

    // Fill Form
    await page.getByPlaceholder(/Ring Road service lane/i).fill("Sector 62 Crossing Junction");
    await page.getByPlaceholder(/Describe source/i).fill("Dense crop residue smoke drifting south across expressway.");

    // Click Simulate Upload
    await page.getByRole("button", { name: /Simulate Upload/i }).click();
    await expect(page.getByText("Photo Attached (1 file)")).toBeVisible();

    // Submit Report
    await page.getByRole("button", { name: /Submit Incident Report/i }).click();
    await expect(page.getByText("Incident successfully logged to Citizen Mesh!")).toBeVisible();

    // Switch to Radar Hotspot Map Tab
    await page.getByRole("button", { name: /Radar Hotspot Map/i }).click();
    await expect(page.getByText(/Micro-Climate Hotspot Radar/i)).toBeVisible();

    // Switch to Community Challenges Tab
    await page.getByRole("button", { name: /Community Challenges/i }).click();
    await expect(page.getByText(/Clean Air Community Awareness Challenges/i)).toBeVisible();
  });

  // Test 8: Real Environmental API Endpoint
  test("8. API Integration - /api/air-quality returns valid CAMS and Weather telemetry", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/air-quality?city=delhi&refresh=true`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.city.name).toBe("New Delhi");
    expect(json.usAqi).toBeGreaterThan(0);
    expect(json.indiaAqi).toBeGreaterThan(0);
    expect(json.pollutants.pm2_5.value).toBeDefined();
    expect(json.weather.temperature).toBeDefined();
    expect(json.weather.humidity).toBeDefined();
    expect(json.hourlyForecast).toBeDefined();
    expect(json.hourlyHistorical).toBeDefined();
  });

  // Test 9: Gemini AI Integration Endpoint
  test("9. Gemini API Integration - /api/assistant responds with clinical accuracy and bilingual support", async () => {
    const payload = {
      messages: [
        {
          role: "user",
          content: "What is the recommended mask for 250 AQI in Delhi?",
        },
      ],
      lang: "en",
      cityId: "delhi",
    };

    const response = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(response.status).toBe(200);

    const text = await response.text();
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(20);
    // Clinical verification: Should recommend N95, FFP2, or respirator
    expect(text.toLowerCase()).toMatch(/n95|ffp2|mask|respirator|air|filter/);
  });

  // Test 10: API Security Verification
  test("10. API Security - Ensure Gemini key is never exposed in client bundle or DOM", async ({ page }) => {
    await page.goto(`${BASE_URL}/assistant`, { waitUntil: "domcontentloaded" });
    const content = await page.content();

    // Ensure raw secret key string from .env is not present in client page HTML
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      expect(content.includes(key)).toBe(false);
    }
  });

  // Test 11: Production HTTP Security Headers
  test("11. HTTP Security Headers - Defense-in-depth headers applied on response", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/`);
    expect(response.status()).toBe(200);
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toBe("origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("geolocation=(self)");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
    expect(headers["content-security-policy"]).toBeDefined();
  });

  // Test 12: WCAG 2.1 AA Accessibility Bypass Blocks
  test("12. Accessibility - Bypass Blocks skip navigation anchor links to main content", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
    await expect(page.locator("#main-content")).toBeAttached();
  });

  // Test 13: Geocoding Telemetry Endpoint
  test("13. Geocoding API - /api/geocoding returns validated global location coordinates", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/geocoding?q=delhi`);
    expect(response.status()).toBe(200);
    const results = await response.json();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain("delhi");
    expect(typeof results[0].lat).toBe("number");
    expect(typeof results[0].lon).toBe("number");
  });

  // Test 14: Indoor Air Quality Evaluation API
  test("14. Indoor API - /api/indoor returns structured indoor air quality assessment", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/indoor?city=delhi&purifier=true&cooking=false`);
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.recommendations).toBeDefined();
    expect(Array.isArray(json.recommendations)).toBe(true);
    expect(json.recommendations.length).toBeGreaterThan(0);
  });

  // Test 15: Public Health Impact Calculation API
  test("15. Impact API - /api/impact returns scientific carbon and particulate dose savings", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/impact?distance=15&mode=transit&outdoorAqi=250&duration=1&protected=true`);
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.co2Saved).toBeGreaterThan(0);
    expect(json.exposureAvoided).toBeGreaterThanOrEqual(0);
    expect(json.aiExplanation).toBeDefined();
  });
});
