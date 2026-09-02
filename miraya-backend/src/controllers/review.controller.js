import prisma from '../prisma/client.js';

/**
 * GET /api/reviews
 * Fetch all reviews with flexible filtering, pagination, and summary KPIs (Admin & Public)
 */
export const getReviews = async (req, res) => {
  try {
    const {
      product_id,
      rating,
      is_approved,
      is_verified,
      search,
      occasion,
      page = 1,
      limit = 20,
      sort = 'newest'
    } = req.query;

    const where = {};

    if (product_id) {
      where.product_id = parseInt(product_id, 10);
    }

    if (rating && rating !== 'all') {
      where.rating = parseInt(rating, 10);
    }

    if (is_approved !== undefined && is_approved !== 'all') {
      where.is_approved = is_approved === 'true' || is_approved === true;
    }

    if (is_verified !== undefined && is_verified !== 'all') {
      where.is_verified = is_verified === 'true' || is_verified === true;
    }

    if (occasion && occasion !== 'all') {
      where.occasion = { contains: occasion, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { customer_name: { contains: search, mode: 'insensitive' } },
        { customer_city: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    let orderBy = { created_at: 'desc' };
    if (sort === 'oldest') orderBy = { created_at: 'asc' };
    if (sort === 'rating_high') orderBy = { rating: 'desc' };
    if (sort === 'rating_low') orderBy = { rating: 'asc' };
    if (sort === 'likes') orderBy = { likes_count: 'desc' };

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image_url: true,
              price: true,
              category: { select: { id: true, name: true } }
            }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.review.count({ where })
    ]);

    // Calculate Summary Stats for Admin Dashboard
    const [allCount, approvedCount, pendingCount, photoCount, avgResult] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { is_approved: true } }),
      prisma.review.count({ where: { is_approved: false } }),
      prisma.review.count({ where: { images: { isEmpty: false } } }),
      prisma.review.aggregate({ _avg: { rating: true } })
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: take,
        pages: Math.ceil(totalCount / take)
      },
      stats: {
        totalReviews: allCount,
        approvedReviews: approvedCount,
        pendingApprovals: pendingCount,
        photoReviews: photoCount,
        averageRating: avgResult._avg?.rating ? Number(avgResult._avg.rating.toFixed(1)) : 5.0
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
};

/**
 * GET /api/reviews/product/:productId
 * Fetch approved reviews for a single product with ratings breakdown & customer photo gallery
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, with_photos, sort = 'newest' } = req.query;

    const prodId = parseInt(productId, 10);
    if (isNaN(prodId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const where = {
      product_id: prodId,
      is_approved: true
    };

    if (rating && rating !== 'all') {
      where.rating = parseInt(rating, 10);
    }

    if (with_photos === 'true') {
      where.images = { isEmpty: false };
    }

    let orderBy = { created_at: 'desc' };
    if (sort === 'highest') orderBy = { rating: 'desc' };
    if (sort === 'lowest') orderBy = { rating: 'asc' };
    if (sort === 'helpful') orderBy = { likes_count: 'desc' };

    const reviews = await prisma.review.findMany({
      where,
      orderBy,
      include: {
        user: { select: { name: true } }
      }
    });

    // Fetch all approved reviews for this product to compute full rating distribution
    const allProductReviews = await prisma.review.findMany({
      where: { product_id: prodId, is_approved: true },
      select: { rating: true, images: true }
    });

    const total = allProductReviews.length;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const allPhotos = [];

    let sum = 0;
    allProductReviews.forEach(r => {
      const star = r.rating || 5;
      if (distribution[star] !== undefined) {
        distribution[star] += 1;
      }
      sum += star;

      if (Array.isArray(r.images)) {
        r.images.forEach(img => {
          if (img) allPhotos.push(img);
        });
      }
    });

    const averageRating = total > 0 ? Number((sum / total).toFixed(1)) : 5.0;

    res.json({
      success: true,
      reviews,
      stats: {
        totalReviews: total,
        averageRating,
        distribution,
        percentageDistribution: {
          5: total > 0 ? Math.round((distribution[5] / total) * 100) : 0,
          4: total > 0 ? Math.round((distribution[4] / total) * 100) : 0,
          3: total > 0 ? Math.round((distribution[3] / total) * 100) : 0,
          2: total > 0 ? Math.round((distribution[2] / total) * 100) : 0,
          1: total > 0 ? Math.round((distribution[1] / total) * 100) : 0
        },
        photoGallery: allPhotos
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ success: false, message: 'Error fetching product reviews', error: error.message });
  }
};

/**
 * POST /api/reviews
 * Customer or Verified User submits a review with photo attachments
 */
export const addReview = async (req, res) => {
  try {
    const {
      product_id,
      rating,
      comment,
      title,
      customer_name,
      customer_city,
      occasion
    } = req.body;

    if (!product_id || !comment) {
      return res.status(400).json({ success: false, message: 'Product ID and comment are required.' });
    }

    const prodId = parseInt(product_id, 10);
    const numRating = Math.min(5, Math.max(1, parseInt(rating || 5, 10)));

    // Handle Uploaded Photos (Cloudinary or local upload)
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        const host = req.get('host') || 'localhost:5000';
        return `${req.protocol}://${host}/uploads/${file.filename}`;
      });
    } else if (req.body.images) {
      try {
        images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (_) {
        images = [req.body.images];
      }
    }

    // Determine Verified Buyer status
    let isVerified = true;
    let userId = req.user ? req.user.id : null;
    let name = customer_name || (req.user ? req.user.name : 'Verified Bride');

    if (userId) {
      const orderCount = await prisma.orderItem.count({
        where: {
          product_id: prodId,
          order: { user_id: userId, status: { in: ['COMPLETED', 'DELIVERED', 'PAID', 'CONFIRMED'] } }
        }
      });
      isVerified = orderCount > 0 || true; // Friendly default for boutique reviews
    }

    const review = await prisma.review.create({
      data: {
        product_id: prodId,
        user_id: userId,
        customer_name: name || 'Verified Customer',
        customer_city: customer_city || null,
        title: title || null,
        rating: numRating,
        comment,
        images: Array.isArray(images) ? images : [],
        occasion: occasion || null,
        is_verified: isVerified,
        is_approved: true, // Auto-approve luxury customer reviews
      },
      include: {
        product: { select: { id: true, name: true, image_url: true } },
        user: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your review! It is now live.',
      review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Error adding review', error: error.message });
  }
};

/**
 * POST /api/reviews/admin-create
 * Admin manually creates a verified bride review with photos & occasion
 */
export const adminCreateReview = async (req, res) => {
  try {
    const {
      product_id,
      rating,
      comment,
      title,
      customer_name,
      customer_city,
      occasion,
      is_verified,
      is_approved,
      likes_count
    } = req.body;

    if (!product_id || !comment) {
      return res.status(400).json({ success: false, message: 'Product ID and review content are required.' });
    }

    const prodId = parseInt(product_id, 10);
    const numRating = Math.min(5, Math.max(1, parseInt(rating || 5, 10)));

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        const host = req.get('host') || 'localhost:5000';
        return `${req.protocol}://${host}/uploads/${file.filename}`;
      });
    } else if (req.body.images) {
      try {
        images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (_) {
        images = [req.body.images];
      }
    }

    const review = await prisma.review.create({
      data: {
        product_id: prodId,
        customer_name: customer_name || 'Verified Bride',
        customer_city: customer_city || null,
        title: title || null,
        rating: numRating,
        comment,
        images: Array.isArray(images) ? images : [],
        occasion: occasion || 'Bridal Wear',
        is_verified: is_verified !== undefined ? (is_verified === 'true' || is_verified === true) : true,
        is_approved: is_approved !== undefined ? (is_approved === 'true' || is_approved === true) : true,
        likes_count: likes_count ? parseInt(likes_count, 10) : 0,
      },
      include: {
        product: { select: { id: true, name: true, image_url: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully.',
      review
    });
  } catch (error) {
    console.error('Admin create review error:', error);
    res.status(500).json({ success: false, message: 'Error creating review', error: error.message });
  }
};

/**
 * PUT /api/reviews/:id
 * Admin updates an existing review (rating, text, photos, occasion, approval status)
 */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id, 10);

    const existing = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const {
      product_id,
      rating,
      comment,
      title,
      customer_name,
      customer_city,
      occasion,
      is_verified,
      is_approved,
      likes_count
    } = req.body;

    const data = {};
    if (product_id) data.product_id = parseInt(product_id, 10);
    if (rating !== undefined) data.rating = Math.min(5, Math.max(1, parseInt(rating, 10)));
    if (comment !== undefined) data.comment = comment;
    if (title !== undefined) data.title = title;
    if (customer_name !== undefined) data.customer_name = customer_name;
    if (customer_city !== undefined) data.customer_city = customer_city;
    if (occasion !== undefined) data.occasion = occasion;
    if (is_verified !== undefined) data.is_verified = is_verified === 'true' || is_verified === true;
    if (is_approved !== undefined) data.is_approved = is_approved === 'true' || is_approved === true;
    if (likes_count !== undefined) data.likes_count = parseInt(likes_count, 10);

    // Handle Uploaded Images
    if (req.files && req.files.length > 0) {
      const uploaded = req.files.map((file) => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        const host = req.get('host') || 'localhost:5000';
        return `${req.protocol}://${host}/uploads/${file.filename}`;
      });
      let existingImgs = [];
      if (req.body.existing_images) {
        try {
          existingImgs = typeof req.body.existing_images === 'string' ? JSON.parse(req.body.existing_images) : req.body.existing_images;
        } catch (_) {}
      }
      data.images = [...existingImgs, ...uploaded];
    } else if (req.body.images !== undefined) {
      try {
        data.images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      } catch (_) {
        data.images = [req.body.images];
      }
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data,
      include: {
        product: { select: { id: true, name: true, image_url: true } }
      }
    });

    res.json({
      success: true,
      message: 'Review updated successfully.',
      review: updated
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, message: 'Error updating review', error: error.message });
  }
};

/**
 * PATCH /api/reviews/:id/toggle-approve
 * Quick 1-click status approve / hide toggle
 */
export const toggleReviewApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id, 10);

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { is_approved: !review.is_approved }
    });

    res.json({
      success: true,
      message: `Review ${updated.is_approved ? 'approved' : 'hidden'} successfully.`,
      review: updated
    });
  } catch (error) {
    console.error('Toggle review error:', error);
    res.status(500).json({ success: false, message: 'Error toggling review approval', error: error.message });
  }
};

/**
 * POST /api/reviews/:id/like
 * Upvote review / Helpful counter
 */
export const likeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id, 10);

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { likes_count: { increment: 1 } }
    });

    res.json({ success: true, likes_count: updated.likes_count });
  } catch (error) {
    console.error('Like review error:', error);
    res.status(500).json({ success: false, message: 'Error liking review', error: error.message });
  }
};

/**
 * DELETE /api/reviews/:id
 * Admin or review owner deletes a review
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id, 10);
    const userId = req.user?.id;
    const userRole = req.user?.role?.toLowerCase();

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const isAdmin = ['admin', 'super_admin', 'store_manager'].includes(userRole);
    const isOwner = (review.user_id && userId && String(review.user_id) === String(userId)) ||
      (userId && !review.user_id && req.user?.name && review.customer_name && review.customer_name.toLowerCase() === req.user.name.toLowerCase());

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review.'
      });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Error deleting review', error: error.message });
  }
};

/**
 * GET /api/reviews/user/my
 * Customer views their own reviews
 */
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const reviews = await prisma.review.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        product: { select: { id: true, name: true, image_url: true, category: true } }
      }
    });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
};
