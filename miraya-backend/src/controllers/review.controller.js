import prisma from '../prisma/client.js';

export const addReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !comment) {
      return res.status(400).json({ message: 'Product ID and comment are required' });
    }

    const review = await prisma.review.create({
      data: {
        user_id: req.user.id,
        product_id: parseInt(product_id),
        rating: rating ? parseInt(rating) : 5,
        comment,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
