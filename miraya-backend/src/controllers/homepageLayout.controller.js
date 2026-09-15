import fs from 'fs';
import path from 'path';
import prisma from '../prisma/client.js';

export const DEFAULT_HOMEPAGE_LAYOUT = [
  {
    id: "sec_hero",
    type: "Hero",
    label: "Hero Video & Atelier Banner",
    is_active: true,
    props: {
      tagline: "Tradition Tailored for Today",
      heading: "Haute Couture & Bridal Atelier",
      subheading: "Nagpur's Premier Destination for Handcrafted Luxury",
      buttonText: "EXPLORE ATELIER",
      buttonLink: "/collection/all",
      videoUrl: "/0911_hero.mp4"
    }
  },
  {
    id: "sec_new_arrivals",
    type: "NewArrivals",
    label: "Fresh Arrivals, Timeless Grace",
    is_active: true,
    props: {
      heading: "Fresh Arrivals,\nTimeless Grace",
      description: "Thoughtfully designed. Beautifully detailed.\nA celebration of you, in every thread.",
      buttonText: "DISCOVER NEW ARRIVALS",
      buttonLink: "/collection/all"
    }
  },
  {
    id: "sec_premium_slider",
    type: "PremiumSlider",
    label: "Editorial Reel & Collection Showcase",
    is_active: true,
    props: {
      heading: "The Atelier Showcase",
      badge: "COUTURE 2026"
    }
  },
  {
    id: "sec_our_story",
    type: "OurStory",
    label: "Our Story & Atelier Journey",
    is_active: true,
    props: {
      title: "The Heart of Miraya",
      tagline: "WHERE HERITAGE MEETS CONTEMPORARY ELEGANCE",
      buttonText: "READ OUR STORY",
      buttonLink: "/about"
    }
  },
  {
    id: "sec_collections",
    type: "Collections",
    label: "Shop by Occasion (Bridal, Sangeet, Haldi)",
    is_active: true,
    props: {
      title: "Curated for Every Celebration",
      subtitle: "Discover ensembles crafted for the moments you will cherish forever."
    }
  },
  {
    id: "sec_real_brides",
    type: "RealBrides",
    label: "Real Brides of Miraya",
    is_active: true,
    props: {
      title: "Real Brides of Miraya",
      subtitle: "Heartwarming moments and joyous celebrations adorned in bespoke Miraya couture."
    }
  },
  {
    id: "sec_core_pillars",
    type: "CorePillars",
    label: "Couture Pillars (Bespoke Craft, Pure Silks)",
    is_active: true,
    props: {
      title: "The Miraya Standard of Excellence",
      subtitle: "Uncompromising quality, personalized fitting, and timeless artisanal mastery."
    }
  },
  {
    id: "sec_lookbook",
    type: "Lookbook",
    label: "Editorial Lookbook & Styling",
    is_active: true,
    props: {
      title: "Editorial Lookbook",
      subtitle: "A visual narrative of silhouettes, textures, and regal grace."
    }
  },
  {
    id: "sec_final_cta",
    type: "FinalCTA",
    label: "Visit Atelier Consultation CTA",
    is_active: true,
    props: {
      heading: "Begin Your Bridal Journey with Us",
      subtitle: "Visit our flagship atelier at Law College Square, Nagpur for an exclusive consultation.",
      buttonText: "BOOK AN APPOINTMENT",
      buttonLink: "/contact"
    }
  }
];

const LOCAL_LAYOUT_FILE = path.join(process.cwd(), 'public', 'homepage-layout.json');

// Helper to safely load cached or default layout
function getFallbackLayout() {
  try {
    if (fs.existsSync(LOCAL_LAYOUT_FILE)) {
      const content = fs.readFileSync(LOCAL_LAYOUT_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return DEFAULT_HOMEPAGE_LAYOUT;
}

// Helper to save locally
function saveFallbackLayout(layout) {
  try {
    const dir = path.dirname(LOCAL_LAYOUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_LAYOUT_FILE, JSON.stringify(layout, null, 2), 'utf8');
  } catch (_) {}
}

/**
 * GET /api/homepage-sections/layout
 * Returns active homepage layout blocks in order
 */
export async function getHomepageLayout(req, res) {
  try {
    let layout = null;

    // Check DB
    try {
      const record = await prisma.homepageSection.findUnique({
        where: { section_name: 'master_layout' }
      });
      if (record && record.description) {
        layout = JSON.parse(record.description);
      }
    } catch (dbErr) {
      console.warn('[HomepageLayout] DB read warning:', dbErr.message);
    }

    if (!layout || !Array.isArray(layout) || layout.length === 0) {
      layout = getFallbackLayout();
    }

    return res.json({
      success: true,
      layout,
      availableSections: DEFAULT_HOMEPAGE_LAYOUT.map(s => ({
        id: s.id,
        type: s.type,
        label: s.label
      }))
    });
  } catch (error) {
    console.error('[HomepageLayout] getHomepageLayout error:', error);
    return res.json({
      success: true,
      layout: DEFAULT_HOMEPAGE_LAYOUT
    });
  }
}

/**
 * PUT /api/homepage-sections/layout
 * Saves full layout array (reordering, active states, custom props)
 */
export async function updateHomepageLayout(req, res) {
  try {
    const { layout } = req.body;

    if (!Array.isArray(layout)) {
      return res.status(400).json({ error: 'Layout must be an array of section objects' });
    }

    // Save locally first for high availability
    saveFallbackLayout(layout);

    // Save in PostgreSQL via Prisma
    try {
      await prisma.homepageSection.upsert({
        where: { section_name: 'master_layout' },
        create: {
          section_name: 'master_layout',
          is_active: true,
          heading: 'Master Homepage Layout',
          description: JSON.stringify(layout)
        },
        update: {
          description: JSON.stringify(layout),
          is_active: true
        }
      });
    } catch (dbErr) {
      console.warn('[HomepageLayout] DB write warning:', dbErr.message);
    }

    return res.json({
      success: true,
      message: 'Homepage layout and sections updated successfully',
      layout
    });
  } catch (error) {
    console.error('[HomepageLayout] updateHomepageLayout error:', error);
    return res.status(500).json({ error: 'Failed to update homepage layout' });
  }
}

/**
 * POST /api/homepage-sections/layout/reset
 * Resets layout back to the pristine luxury atelier default
 */
export async function resetHomepageLayout(req, res) {
  try {
    saveFallbackLayout(DEFAULT_HOMEPAGE_LAYOUT);

    try {
      await prisma.homepageSection.upsert({
        where: { section_name: 'master_layout' },
        create: {
          section_name: 'master_layout',
          is_active: true,
          heading: 'Master Homepage Layout',
          description: JSON.stringify(DEFAULT_HOMEPAGE_LAYOUT)
        },
        update: {
          description: JSON.stringify(DEFAULT_HOMEPAGE_LAYOUT)
        }
      });
    } catch (dbErr) {
      console.warn('[HomepageLayout] DB reset warning:', dbErr.message);
    }

    return res.json({
      success: true,
      message: 'Homepage layout reset to default',
      layout: DEFAULT_HOMEPAGE_LAYOUT
    });
  } catch (error) {
    console.error('[HomepageLayout] resetHomepageLayout error:', error);
    return res.status(500).json({ error: 'Failed to reset homepage layout' });
  }
}
