import prisma from '../prisma/client.js';

// Get or auto-initialize New Arrivals homepage section
export async function getNewArrivalsSection(req, res) {
  try {
    let section = await prisma.homepageSection.findUnique({
      where: { section_name: 'new_arrivals' },
      include: {
        newArrivalItems: {
          orderBy: { display_order: 'asc' },
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      // Auto-create default section if not found
      section = await prisma.homepageSection.create({
        data: {
          section_name: 'new_arrivals',
          is_active: true,
          heading: 'Fresh Arrivals,\nTimeless Grace',
          description: 'Thoughtfully designed. Beautifully detailed.\nA celebration of you, in every thread.',
          button_text: 'DISCOVER NEW ARRIVALS',
          button_link: '/collection/all',
        },
        include: {
          newArrivalItems: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });
    }

    res.json(section);
  } catch (error) {
    console.error('[HomepageSection] getNewArrivalsSection error:', error);
    res.status(500).json({ error: 'Failed to fetch New Arrivals section configuration' });
  }
}

// Update New Arrivals section settings & card items (Admin only)
export async function updateNewArrivalsSection(req, res) {
  try {
    const {
      is_active,
      heading,
      description,
      button_text,
      button_link,
      items, // array of { product_id, display_order, custom_image, crop_position, tagline }
    } = req.body;

    // 1. Find or create the master section
    let section = await prisma.homepageSection.findUnique({
      where: { section_name: 'new_arrivals' },
    });

    if (!section) {
      section = await prisma.homepageSection.create({
        data: {
          section_name: 'new_arrivals',
          is_active: is_active ?? true,
          heading: heading || 'Fresh Arrivals,\nTimeless Grace',
          description: description || 'Thoughtfully designed. Beautifully detailed.\nA celebration of you, in every thread.',
          button_text: button_text || 'DISCOVER NEW ARRIVALS',
          button_link: button_link || '/collection/all',
        },
      });
    } else {
      section = await prisma.homepageSection.update({
        where: { id: section.id },
        data: {
          ...(typeof is_active === 'boolean' ? { is_active } : {}),
          ...(heading !== undefined ? { heading } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(button_text !== undefined ? { button_text } : {}),
          ...(button_link !== undefined ? { button_link } : {}),
        },
      });
    }

    // 2. If items are provided, replace existing items with validated, reordered items (max 4, unique)
    if (Array.isArray(items)) {
      // Validate: limit to max 4 unique products
      const seenProductIds = new Set();
      const validItems = [];

      for (let i = 0; i < items.length && validItems.length < 4; i++) {
        const item = items[i];
        const pid = Number(item.product_id);
        if (pid && !seenProductIds.has(pid)) {
          seenProductIds.add(pid);
          validItems.push({
            section_id: section.id,
            product_id: pid,
            display_order: validItems.length,
            custom_image: item.custom_image || null,
            crop_position: item.crop_position || null,
            tagline: item.tagline || null,
          });
        }
      }

      // Transaction: remove old items and insert updated items
      await prisma.$transaction([
        prisma.newArrivalItem.deleteMany({
          where: { section_id: section.id },
        }),
        prisma.newArrivalItem.createMany({
          data: validItems,
        }),
      ]);
    }

    // Fetch and return the updated complete section with products
    const updatedSection = await prisma.homepageSection.findUnique({
      where: { id: section.id },
      include: {
        newArrivalItems: {
          orderBy: { display_order: 'asc' },
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'New Arrivals section updated successfully',
      data: updatedSection,
    });
  } catch (error) {
    console.error('[HomepageSection] updateNewArrivalsSection error:', error);
    res.status(500).json({ error: 'Failed to update New Arrivals section configuration' });
  }
}
