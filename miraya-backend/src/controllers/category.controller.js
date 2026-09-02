import prisma from '../prisma/client.js';
import { emitStoreSettingsUpdated } from '../services/realtime.service.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = await prisma.category.create({ data: { name: name.trim() } });
    
    // Broadcast realtime event so frontend filters update instantly
    emitStoreSettingsUpdated({ type: 'category_created', category });

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = await prisma.category.update({
      where: { id: parseInt(id, 10) },
      data: { name: name.trim() },
    });

    // Broadcast realtime event
    emitStoreSettingsUpdated({ type: 'category_updated', category });

    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const catId = parseInt(id, 10);

    // Reassign or disassociate products safely
    await prisma.product.updateMany({
      where: { category_id: catId },
      data: { category_id: null },
    });

    await prisma.category.delete({ where: { id: catId } });

    // Broadcast realtime event
    emitStoreSettingsUpdated({ type: 'category_deleted', id: catId });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
