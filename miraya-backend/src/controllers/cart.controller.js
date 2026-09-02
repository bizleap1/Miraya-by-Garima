import prisma from '../prisma/client.js';

export const getCart = async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { user_id: req.user.id },
      include: {
        product: true,
        variant: true,
      },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cart', error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const rawProductId = req.body.product_id || req.body.productId;
    const { quantity, size, variant_id } = req.body;

    const qty = parseInt(quantity !== undefined ? quantity : 1, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_QUANTITY',
        message: 'Quantity must be at least 1.',
      });
    }

    const pid = parseInt(rawProductId, 10);
    if (isNaN(pid)) {
      return res.status(400).json({ success: false, code: 'INVALID_PRODUCT_ID', message: 'Valid product_id is required.' });
    }

    let targetVariantId = variant_id ? parseInt(variant_id, 10) : null;
    let targetVariant = null;

    if (targetVariantId) {
      targetVariant = await prisma.productVariant.findUnique({ where: { id: targetVariantId } });
    }

    if (!targetVariant && size) {
      targetVariant = await prisma.productVariant.findFirst({
        where: {
          product_id: pid,
          size: { equals: size, mode: 'insensitive' },
        },
      });
    }

    if (!targetVariant) {
      targetVariant = await prisma.productVariant.findFirst({
        where: { product_id: pid, is_active: true },
      });
    }

    if (!targetVariant) {
      return res.status(404).json({
        success: false,
        code: 'VARIANT_NOT_FOUND',
        message: 'Product variant is not available or inactive.',
      });
    }

    targetVariantId = targetVariant.id;
    const availableStock = Math.max(0, targetVariant.stock - targetVariant.reserved_stock);

    const existing = await prisma.cartItem.findFirst({
      where: {
        user_id: req.user.id,
        product_id: pid,
        size: size || targetVariant.size || null,
      },
    });

    const totalRequestedQty = existing ? existing.quantity + qty : qty;

    if (totalRequestedQty > availableStock) {
      return res.status(409).json({
        success: false,
        code: 'OUT_OF_STOCK',
        message: `Insufficient stock available for "${targetVariant.sku || 'selected size'}". Available: ${availableStock}, Requested total: ${totalRequestedQty}`,
        availableStock,
      });
    }

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: totalRequestedQty,
          variant_id: targetVariantId,
        },
        include: { product: true, variant: true },
      });
      return res.json({ success: true, message: 'Cart updated', cartItem: updated });
    }

    const item = await prisma.cartItem.create({
      data: {
        user_id: req.user.id,
        product_id: pid,
        variant_id: targetVariantId,
        quantity: qty,
        size: size || targetVariant.size || null,
      },
      include: { product: true, variant: true },
    });

    res.status(201).json({ success: true, message: 'Item added to cart', cartItem: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, size } = req.body;

    if (quantity !== undefined) {
      const parsedQty = parseInt(quantity, 10);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_QUANTITY',
          message: 'Quantity must be at least 1.',
        });
      }
    }

    const existing = await prisma.cartItem.findFirst({
      where: { id: parseInt(id, 10), user_id: req.user.id },
      include: { variant: true },
    });

    if (!existing) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to modify this cart item.' });
    }

    let targetVariant = existing.variant;
    if (size && size !== existing.size) {
      const v = await prisma.productVariant.findFirst({
        where: {
          product_id: existing.product_id,
          size: { equals: size, mode: 'insensitive' },
        },
      });
      if (v) targetVariant = v;
    }

    const newQty = quantity !== undefined ? parseInt(quantity, 10) : existing.quantity;

    if (targetVariant) {
      const availableStock = Math.max(0, targetVariant.stock - targetVariant.reserved_stock);
      if (newQty > availableStock) {
        return res.status(409).json({
          success: false,
          code: 'OUT_OF_STOCK',
          message: `Insufficient stock available. Available: ${availableStock}, Requested: ${newQty}`,
          availableStock,
        });
      }
    }

    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: newQty,
        ...(size !== undefined && { size, variant_id: targetVariant ? targetVariant.id : existing.variant_id }),
      },
      include: { product: true, variant: true },
    });

    res.json({ success: true, message: 'Cart item updated', cartItem: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating cart item', error: error.message });
  }
};


export const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.cartItem.findFirst({
      where: { id: parseInt(id, 10), user_id: req.user.id },
    });

    if (!existing) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to delete this cart item.' });
    }

    await prisma.cartItem.delete({ where: { id: existing.id } });
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing item from cart', error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { user_id: req.user.id } });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
};
