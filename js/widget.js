(function () {
  const MIN_DATE = "1995-06-16";

  function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function randomDate(start, end) {
    const startMs = start.getTime();
    const endMs = end.getTime();
    const rand = new Date(startMs + Math.random() * (endMs - startMs));
    return formatDate(rand);
  }

  function truncate(text, n) {
    if (!text) return "";
    return text.length > n ? text.slice(0, n - 1) + "…" : text;
  }

  function makeEmbedUrl(url) {
    try {
      if (!url) return url;
      const u = new URL(url);
      if (u.hostname.includes("youtube.com") && u.searchParams.has("v")) {
        return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
      }
      if (u.hostname === "youtu.be") {
        return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
      }
      // Otherwise return original (may already be an embed)
      return url;
    } catch (e) {
      return url;
    }
  }

  // Background helper: use a body pseudo-element via CSS variable + classes
  function setBackgroundImage(url) {
    if (!url) {
      clearBackground();
      return;
    }
    document.body.classList.add("apod-bg");
    // set CSS variable for the pseudo-element
    document.body.style.setProperty("--apod-bg-image", `url('${url}')`);
    // force reflow then reveal with visible class for transition
    void document.body.offsetWidth;
    document.body.classList.add("apod-bg-visible");
  }

  function clearBackground() {
    document.body.classList.remove("apod-bg-visible");
    // clear after transition completes
    setTimeout(() => {
      document.body.classList.remove("apod-bg");
      document.body.style.removeProperty("--apod-bg-image");
    }, 1000);
  }

  // Create or get the floating control panel for all pages
  function ensureFloatingControls() {
    let panel = document.getElementById("apod-floating-controls");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "apod-floating-controls";
      panel.className = "apod-floating-panel";
      panel.innerHTML = `
        <div class="apod-panel-content">
          <div class="apod-controls-inner">
            <label for="apod-date-global" class="apod-label">Select Date</label>
            <input type="date" id="apod-date-global" class="apod-date-global" min="${MIN_DATE}" max="${formatDate(new Date())}" value="${formatDate(new Date())}">
            <button type="button" class="apod-random-global">Surprise Me</button>
          </div>
          <button type="button" class="apod-toggle" aria-label="Toggle APOD controls" aria-expanded="false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(panel);
    }
    return panel;
  }

  // Check if a position overlaps with visible content elements
  function isPositionValid(top, left) {
    // Convert percentage to pixels
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const topPx = (parseFloat(top) / 100) * viewportHeight;
    const leftPx = (parseFloat(left) / 100) * viewportWidth;

    // Get the main content area bounds to avoid it
    const main = document.querySelector("main");
    const navbar = document.querySelector(".navbar");
    const footer = document.querySelector("footer");

    if (main) {
      const mainRect = main.getBoundingClientRect();
      // Add padding around content
      const padding = 60;
      if (
        leftPx > mainRect.left - padding &&
        leftPx < mainRect.right + padding &&
        topPx > mainRect.top - padding &&
        topPx < mainRect.bottom + padding
      ) {
        return false;
      }
    }

    if (navbar) {
      const navRect = navbar.getBoundingClientRect();
      if (
        leftPx > navRect.left &&
        leftPx < navRect.right &&
        topPx > navRect.top &&
        topPx < navRect.bottom + 20
      ) {
        return false;
      }
    }

    if (footer) {
      const footerRect = footer.getBoundingClientRect();
      if (
        leftPx > footerRect.left &&
        leftPx < footerRect.right &&
        topPx > footerRect.top - 20 &&
        topPx < footerRect.bottom
      ) {
        return false;
      }
    }

    return true;
  }

  // Generate random position for a star, avoiding all content
  function getRandomPosition() {
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Random position across full viewport
      const topPercent = Math.floor(Math.random() * 90) + 5; // 5% to 95%
      const leftPercent = Math.floor(Math.random() * 90) + 5; // 5% to 95%
      const top = `${topPercent}%`;
      const left = `${leftPercent}%`;

      if (isPositionValid(top, left)) {
        return { top, left };
      }

      attempts++;
    }

    // Fallback: spread stars around the edges if center is too crowded
    const edgePositions = [
      { top: "10%", left: "3%" },
      { top: "20%", left: "2%" },
      { top: "30%", left: "3%" },
      { top: "40%", left: "2%" },
      { top: "60%", left: "3%" },
      { top: "10%", left: "97%" },
      { top: "20%", left: "96%" },
      { top: "30%", left: "97%" },
      { top: "40%", left: "96%" },
      { top: "60%", left: "97%" },
    ];

    return edgePositions[Math.floor(Math.random() * edgePositions.length)];
  }

  // Create a single star element with random position
  function createStar(index, starsContainer) {
    const star = document.createElement("button");
    star.className = "apod-floating-star";
    star.setAttribute("aria-label", "Change background");

    const pos = getRandomPosition();
    star.style.top = pos.top;
    star.style.left = pos.left;
    star.style.animationDelay = `${index * 0.3}s`;

    star.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/>
      </svg>
    `;

    star.addEventListener("click", (e) => {
      e.stopPropagation();
      const rnd = randomDate(new Date(MIN_DATE), new Date());
      fetchAPOD(rnd);

      // Despawn animation
      star.style.transform = "scale(2) rotate(180deg)";
      star.style.opacity = "0";

      // Remove from DOM after animation
      setTimeout(() => {
        star.remove();

        // Respawn after 5 seconds with new random position
        setTimeout(() => {
          createStar(index, starsContainer);
        }, 5000);
      }, 500);
    });

    starsContainer.appendChild(star);
  }

  // Create floating interactive stars on background
  function createFloatingStars() {
    const container = document.getElementById("apod-stars-container");
    if (container) return; // Already created

    const starsContainer = document.createElement("div");
    starsContainer.id = "apod-stars-container";
    starsContainer.className = "apod-stars-container";

    // Create 8 stars at random positions
    for (let i = 0; i < 8; i++) {
      createStar(i, starsContainer);
    }

    document.body.appendChild(starsContainer);
  }

  async function fetchAPOD(date, retryCount = 0) {
    const root = document.getElementById("widget-root");
    const hasRoot = !!root;
    if (hasRoot) {
      root.innerHTML = '<div class="widget-loading">Loading…</div>';
    } else {
      console.log("APOD: loading", date);
    }

    const apiKey =
      window.NASA_CONFIG && window.NASA_CONFIG.API_KEY
        ? window.NASA_CONFIG.API_KEY
        : "DEMO_KEY";
    const endpoint = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}&date=${encodeURIComponent(date)}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // If video is returned, fetch a different random date (only images)
      if (data.media_type === "video") {
        if (retryCount < 10) {
          console.log("Video found, fetching new date for image...");
          const newDate = randomDate(new Date(MIN_DATE), new Date());
          return fetchAPOD(newDate, retryCount + 1);
        } else {
          console.warn("Max retries reached, using video thumbnail");
        }
      }

      if (hasRoot) root.innerHTML = "";

      // Prepare container only when we have a root to render into
      let container,
        overlay,
        title,
        snippet,
        meta,
        controls,
        dateInput,
        surprise;
      if (hasRoot) {
        container = document.createElement("div");
        container.className = "widget-inner apod-card";

        var mediaWrap = document.createElement("div");
        mediaWrap.className = "widget-media";
      }

      if (data.media_type === "image") {
        const bgUrl = data.hdurl || data.url;
        setBackgroundImage(bgUrl);
        if (hasRoot) {
          mediaWrap.style.minHeight = "140px";
          mediaWrap.style.display = "block";
        }
      } else if (data.media_type === "video") {
        // Fallback if max retries reached
        if (data.thumbnail_url) {
          setBackgroundImage(data.thumbnail_url);
        } else {
          clearBackground();
        }
      } else {
        if (hasRoot) mediaWrap.textContent = "Unsupported media type.";
        clearBackground();
      }

      if (hasRoot) {
        // Display as a static project card without API details
        const img = document.createElement("img");
        img.src = "assets/images/nasa-apod.jpg";
        img.alt = "NASA Space Background";
        img.className = "project-thumb";
        img.loading = "lazy";
        img.onerror = function () {
          // Fallback if custom image doesn't exist
          this.src =
            data.media_type === "image"
              ? data.url
              : "https://apod.nasa.gov/apod/image/2402/placeholder.jpg";
        };
        root.appendChild(img);

        const h2 = document.createElement("h2");
        h2.textContent = "Dynamic Space Background";
        root.appendChild(h2);

        const desc = document.createElement("p");
        desc.textContent =
          "Live astronomy backgrounds powered by NASA's Astronomy Picture of the Day API. The site background updates with stunning space imagery.";
        root.appendChild(desc);

        const techStack = document.createElement("p");
        techStack.className = "tech-stack";
        techStack.textContent = "JavaScript, NASA APOD API, CSS Animations";
        root.appendChild(techStack);

        const link = document.createElement("a");
        link.href = "https://apod.nasa.gov/apod/";
        link.className = "project-link";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Learn More →";
        root.appendChild(link);
      }

      return data;
    } catch (err) {
      if (document.getElementById("widget-root")) {
        document.getElementById("widget-root").innerHTML =
          '<div class="widget-error">Error loading APOD.</div>';
      }
      console.error("APOD error", err);
    }
  }

  function initWidget(opts = {}) {
    const root = document.getElementById("widget-root");

    // Try to set default background to static nasa-apod.jpg
    const defaultImg = new Image();
    defaultImg.src = "/assets/images/nasa-apod.jpg";
    defaultImg.onload = () => {
      setBackgroundImage("/assets/images/nasa-apod.jpg");
    };
    defaultImg.onerror = () => {
      // Fallback: fetch today's APOD if nasa-apod.jpg doesn't exist
      const today = formatDate(new Date());
      fetchAPOD(opts.date || today);
    };

    // Create floating controls on all pages
    const panel = ensureFloatingControls();
    const toggle = panel.querySelector(".apod-toggle");
    const dateInput = panel.querySelector(".apod-date-global");
    const surprise = panel.querySelector(".apod-random-global");

    // Delay star creation to ensure page content is fully rendered
    // This allows collision detection to work properly
    setTimeout(() => {
      createFloatingStars();
    }, 500);

    // Toggle panel open/close with sun button
    toggle.addEventListener("click", () => {
      panel.classList.toggle("apod-panel-open");
      const isOpen = panel.classList.contains("apod-panel-open");
      toggle.setAttribute("aria-expanded", isOpen);
    });

    // Date change handler
    dateInput.addEventListener("change", (e) => {
      if (e.target.value) {
        fetchAPOD(e.target.value);
      }
    });

    // Surprise Me handler
    surprise.addEventListener("click", () => {
      const rnd = randomDate(new Date(MIN_DATE), new Date());
      dateInput.value = rnd;
      fetchAPOD(rnd);
    });

    // Close panel when clicking outside
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target)) {
        panel.classList.remove("apod-panel-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    // expose programmatic fetch
    window.MyWidget = {
      init: initWidget,
      fetchForDate: (d) => fetchAPOD(d),
      random: () => fetchAPOD(randomDate(new Date(MIN_DATE), new Date())),
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidget);
  } else {
    initWidget();
  }
})();
