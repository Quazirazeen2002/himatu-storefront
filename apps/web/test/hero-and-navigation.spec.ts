import fs from "fs";
import path from "path";

describe("Hero Anime Video and Navigation Dropdown Fixes", () => {
  it("has the downloaded high-resolution anime video in public/videos", () => {
    const videoPath = path.resolve(__dirname, "../public/videos/hero-anime.mp4");
    expect(fs.existsSync(videoPath)).toBe(true);

    const stats = fs.statSync(videoPath);
    expect(stats.size).toBeGreaterThan(1_000_000); // ~2MB high-res video
  });

  it("has the video poster frame in public/videos", () => {
    const posterPath = path.resolve(__dirname, "../public/videos/hero-anime-poster.jpg");
    expect(fs.existsSync(posterPath)).toBe(true);

    const stats = fs.statSync(posterPath);
    expect(stats.size).toBeGreaterThan(10_000);
  });

  it("configures HeroSlideshow to display the anime video as the first hero slide", () => {
    const heroSlideshowCode = fs.readFileSync(
      path.resolve(__dirname, "../src/components/campaigns/HeroSlideshow.tsx"),
      "utf-8"
    );

    expect(heroSlideshowCode).toContain("/videos/hero-anime.mp4");
    expect(heroSlideshowCode).toContain("/videos/hero-anime-poster.jpg");
    expect(heroSlideshowCode).toContain("hero-video-element");
    expect(heroSlideshowCode).toContain("autoPlay");
    expect(heroSlideshowCode).toContain("muted={isMuted}");
    expect(heroSlideshowCode).toContain("toggleSound");
  });

  it("ensures Header closes the Categories and Collections dropdown immediately on link click and route change", () => {
    const headerCode = fs.readFileSync(
      path.resolve(__dirname, "../src/components/layout/Header.tsx"),
      "utf-8"
    );

    // Controlled state
    expect(headerCode).toContain("const [openDropdown, setOpenDropdown] = useState");
    expect(headerCode).toContain("closeDropdown");
    expect(headerCode).toContain("document.activeElement.blur()");
    expect(headerCode).toContain("pathname");

    // Close on click inside dropdown
    expect(headerCode).toContain("onClick={closeDropdown}");
  });

  it("ensures CSS strictly hides the dropdown when not is-open", () => {
    const aboutCss = fs.readFileSync(
      path.resolve(__dirname, "../src/app/about-refresh.css"),
      "utf-8"
    );
    const taxonomyCss = fs.readFileSync(
      path.resolve(__dirname, "../src/app/taxonomy.css"),
      "utf-8"
    );
    const globalsCss = fs.readFileSync(
      path.resolve(__dirname, "../src/app/globals.css"),
      "utf-8"
    );

    expect(aboutCss).toContain(".header .nav-item:not(.is-open) .nav-dropdown--mega");
    expect(aboutCss).toContain("display:none !important");

    expect(taxonomyCss).toContain(".header .nav-item:not(.is-open) .nav-dropdown");
    expect(taxonomyCss).toContain("display: none !important");

    expect(globalsCss).toContain(".nav-item:not(.is-open) .nav-dropdown");
  });
});
