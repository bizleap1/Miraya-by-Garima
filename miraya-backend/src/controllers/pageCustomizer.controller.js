import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get customizer data for a specific page (e.g. "new-arrivals")
export const getPageData = async (req, res) => {
  try {
    const { pageName } = req.params;
    const pageData = await prisma.pageCustomizer.findUnique({
      where: { page_name: pageName }
    });

    if (!pageData) {
      return res.status(200).json({ page_name: pageName, product_ids: [], products: [] });
    }

    // Fetch the actual products based on the product_ids array
    // We need to maintain the exact order specified in product_ids
    if (pageData.product_ids && pageData.product_ids.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: pageData.product_ids } },
        include: { variants: true, category: true }
      });

      // Sort products according to product_ids array
      const sortedProducts = pageData.product_ids
        .map(id => products.find(p => p.id === id))
        .filter(p => p); // Remove nulls if a product was deleted

      return res.status(200).json({
        page_name: pageData.page_name,
        product_ids: pageData.product_ids,
        products: sortedProducts
      });
    }

    return res.status(200).json({ page_name: pageData.page_name, product_ids: [], products: [] });

  } catch (error) {
    console.error('Error fetching page customizer:', error);
    res.status(500).json({ error: 'Failed to fetch page data' });
  }
};

// Update customizer data for a specific page
export const updatePageData = async (req, res) => {
  try {
    const { pageName } = req.params;
    const { product_ids } = req.body;

    if (!Array.isArray(product_ids)) {
      return res.status(400).json({ error: 'product_ids must be an array' });
    }

    const updatedData = await prisma.pageCustomizer.upsert({
      where: { page_name: pageName },
      update: { product_ids },
      create: {
        page_name: pageName,
        product_ids
      }
    });

    res.status(200).json(updatedData);
  } catch (error) {
    console.error('Error updating page customizer:', error);
    res.status(500).json({ error: 'Failed to update page data' });
  }
};
