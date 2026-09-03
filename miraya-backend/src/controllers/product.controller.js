import prisma from '../prisma/client.js';
import {
  emitProductCreated,
  emitProductUpdated,
  emitProductDeleted,
  emitInventoryUpdated,
} from '../services/realtime.service.js';


export const getProducts = async (req, res) => {
  try {
    const { search, category, sort, include_inactive } = req.query;

    const where = {};

    // Public storefront should ONLY see active products (not soft-archived/deleted)
    if (include_inactive !== 'true') {
      where.variants = {
        some: {
          is_active: true,
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      const catTrim = String(category).trim();
      const numId = parseInt(catTrim, 10);

      if (!isNaN(numId) && String(numId) === catTrim) {
        where.category_id = numId;
      } else {
        const altName = catTrim.replace(/-/g, ' ');
        where.OR = [
          { category: { name: { contains: altName, mode: 'insensitive' } } },
          { sub_category: { contains: altName, mode: 'insensitive' } },
        ];
      }
    }


    let orderBy = { created_at: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        variants: {
          orderBy: { size: 'asc' },
        },
        reviews: true,
      },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id || '').trim();

    let product = null;
    const numId = parseInt(cleanId, 10);

    // 1. If cleanId is purely numeric, find by primary key
    if (!isNaN(numId) && String(numId) === cleanId) {
      product = await prisma.product.findUnique({
        where: { id: numId },
        include: {
          category: true,
          variants: {
            orderBy: { size: 'asc' },
          },
          reviews: { include: { user: { select: { name: true } } } },
        },
      });
    }

    // 2. If not found, map catalog IDs (e.g. "iw-1", "ds-2", "coord-3", "dress-5")
    if (!product) {
      const catalogIdMap = {
        'iw-1': 1, 'iw-2': 2, 'iw-3': 3, 'iw-4': 4,
        'ds-1': 5, 'ds-2': 6, 'ds-3': 7,
        'suit-1': 8, 'suit-2': 9, 'suit-3': 10, 'suit-4': 11,
        'psm-1': 12, 'psm-2': 13,
        'coord-1': 14, 'coord-2': 15, 'coord-3': 16, 'coord-4': 17,
        'coord-5': 18, 'coord-6': 19, 'coord-7': 20, 'coord-8': 21, 'coord-9': 22,
        'dress-1': 23, 'dress-2': 24, 'dress-3': 25, 'dress-4': 26,
        'dress-5': 27, 'dress-6': 28, 'dress-7': 29, 'dress-8': 30,
        'dress-9': 31, 'dress-10': 32, 'dress-11': 33, 'dress-12': 34,
        'dress-13': 35, 'dress-14': 36, 'dress-15': 37, 'dress-16': 38,
      };

      const lowerId = cleanId.toLowerCase();
      const matchedCatalogKey = Object.keys(catalogIdMap).find(k => lowerId === k || lowerId.endsWith(`-${k}`));

      if (matchedCatalogKey) {
        const mappedDbId = catalogIdMap[matchedCatalogKey];
        product = await prisma.product.findUnique({
          where: { id: mappedDbId },
          include: {
            category: true,
            variants: {
              orderBy: { size: 'asc' },
            },
            reviews: { include: { user: { select: { name: true } } } },
          },
        });
      }
    }

    // 3. If still not found, search by name, image_url, or variant SKU
    if (!product) {
      const cleanName = cleanId.replace(/[-_]+/g, ' ').trim();
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: cleanName, mode: 'insensitive' } },
            { image_url: { contains: cleanId, mode: 'insensitive' } },
            { variants: { some: { sku: { contains: cleanId, mode: 'insensitive' } } } }
          ]
        },
        include: {
          category: true,
          variants: {
            orderBy: { size: 'asc' },
          },
          reviews: { include: { user: { select: { name: true } } } },
        },
      });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching product', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mrp,
      mrp_price,
      stock,
      category_id,
      sub_category,
      sizes,
      size_stock,
      color,
      variants: explicitVariants
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and price are required.' });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      const uploaded = req.files.map((file) => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        const host = req.get('host') || 'localhost:5000';
        return `${req.protocol}://${host}/uploads/${file.filename}`;
      });
      let existing = [];
      if (req.body.existing_images) {
        try {
          existing = typeof req.body.existing_images === 'string' ? JSON.parse(req.body.existing_images) : req.body.existing_images;
        } catch (_) {}
      }

      if (req.body.gallery_order) {
        try {
          const order = typeof req.body.gallery_order === 'string' ? JSON.parse(req.body.gallery_order) : req.body.gallery_order;
          let upIdx = 0;
          let exIdx = 0;
          images = order.map((item) => {
            if (item === '__NEW_FILE__' && upIdx < uploaded.length) {
              return uploaded[upIdx++];
            }
            if (item !== '__NEW_FILE__' && existing.includes(item)) {
              return item;
            }
            if (exIdx < existing.length) {
              return existing[exIdx++];
            }
            return item;
          }).filter(Boolean);

          while (upIdx < uploaded.length) images.push(uploaded[upIdx++]);
          while (exIdx < existing.length) {
            if (!images.includes(existing[exIdx])) images.push(existing[exIdx]);
            exIdx++;
          }
        } catch (_) {
          images = [...uploaded, ...existing];
        }
      } else {
        images = [...uploaded, ...existing];
      }
    } else if (req.body.images) {
      images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
    } else if (req.body.image_url) {
      images = [req.body.image_url];
    }

    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes || [];
    const parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock || {};
    const parsedExplicitVariants = typeof explicitVariants === 'string' ? JSON.parse(explicitVariants) : explicitVariants;

    const numPrice = parseFloat(price);
    const rawMrp = mrp !== undefined ? mrp : (mrp_price !== undefined ? mrp_price : (req.body.mrp || req.body.mrp_price));
    const parsedMrp = rawMrp ? parseFloat(rawMrp) : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Determine sizes & variant structure
      const rawSizes = Array.isArray(parsedSizes) && parsedSizes.length > 0
        ? parsedSizes
        : (Object.keys(parsedSizeStock).length > 0 ? Object.keys(parsedSizeStock) : ['Free Size']);
      const targetSizes = [...new Set(rawSizes)];

      const totalStock = Object.keys(parsedSizeStock).length > 0
        ? Object.values(parsedSizeStock).reduce((a, b) => a + Number(b || 0), 0)
        : parseInt(stock || 0, 10);

      // Validate category_id exists in database if supplied
      let validCategoryId = null;
      if (category_id) {
        const catNum = parseInt(category_id, 10);
        if (!isNaN(catNum)) {
          const catExists = await tx.category.findUnique({ where: { id: catNum } });
          if (catExists) validCategoryId = catNum;
        }
      }

      // Create base product
      const product = await tx.product.create({
        data: {
          name,
          description,
          price: numPrice,
          mrp_price: parsedMrp,
          stock: totalStock,
          image_url: images[0] || null,
          images,
          category_id: validCategoryId,
          sub_category: sub_category || null,
          fabric: req.body.fabric || null,
          embroidery: req.body.embroidery || null,
          wash_care: req.body.wash_care || null,
          fit_notes: req.body.fit_notes || null,
          dispatch_info: req.body.dispatch_info || null,
          highlights: req.body.highlights || null,
          promo_label: req.body.promo_label || null,
          sizes: targetSizes,
          size_stock: parsedSizeStock,
          whatsapp_inquiry: req.body.whatsapp_inquiry === 'true' || req.body.whatsapp_inquiry === true || false,
        },
      });

      // 2. Create authoritative ProductVariants
      const skuPrefix = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'MIR';
      const createdVariants = [];

      if (Array.isArray(parsedExplicitVariants) && parsedExplicitVariants.length > 0) {
        for (const ev of parsedExplicitVariants) {
          const vSku = ev.sku || `MIR-${skuPrefix}-${product.id}-${(ev.size || 'M').toUpperCase()}`;
          const vStock = parseInt(ev.stock || 0, 10);
          const v = await tx.productVariant.create({
            data: {
              product_id: product.id,
              sku: vSku,
              barcode: ev.barcode || `BAR-${product.id}-${(ev.size || 'M').replace(/\s+/g, '-').toUpperCase()}`,
              size: ev.size || 'Free Size',
              color: ev.color || color || 'Default',
              price: ev.price !== undefined ? parseFloat(ev.price) : numPrice,
              mrp_price: ev.mrp_price ? parseFloat(ev.mrp_price) : parsedMrp,
              stock: vStock,
              is_active: ev.is_active !== undefined ? ev.is_active : true,
            },
          });
          createdVariants.push(v);
        }
      } else {
        for (const sz of targetSizes) {
          const vStock = parsedSizeStock[sz] !== undefined ? parseInt(parsedSizeStock[sz], 10) : Math.max(0, Math.floor(totalStock / targetSizes.length));
          const cleanSize = String(sz).replace(/\s+/g, '-').toUpperCase();
          const vSku = `MIR-${skuPrefix}-${product.id}-${cleanSize}`;
          const v = await tx.productVariant.create({
            data: {
              product_id: product.id,
              sku: vSku,
              barcode: `BAR-${product.id}-${cleanSize}`,
              size: sz,
              color: color || 'Default',
              price: numPrice,
              mrp_price: parsedMrp,
              stock: vStock,
              is_active: true,
            },
          });
          createdVariants.push(v);
        }
      }

      // Sync computed product.stock and size_stock
      const realTotalStock = createdVariants.reduce((sum, v) => sum + v.stock, 0);
      const computedSizeStock = {};
      createdVariants.forEach(v => { computedSizeStock[v.size] = (computedSizeStock[v.size] || 0) + v.stock; });

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          stock: realTotalStock,
          size_stock: computedSizeStock,
        },
        include: {
          category: true,
          variants: true,
        },
      });

      return updatedProduct;
    });

    // Realtime broadcast after DB commit
    emitProductCreated(result);
    if (result.variants && Array.isArray(result.variants)) {
      result.variants.forEach(v => {
        emitInventoryUpdated({ variantId: v.id, productId: v.product_id, stock: v.stock, reserved_stock: v.reserved_stock || 0 });
      });
    }

    res.status(201).json({ success: true, message: 'Product and authoritative variants created successfully', product: result });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Error creating product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id, sub_category, sizes, size_stock, variants } = req.body;

    const productId = parseInt(id, 10);
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (price) data.price = parseFloat(price);
    if (category_id) data.category_id = parseInt(category_id, 10);
    if (sub_category) data.sub_category = sub_category;
    if (req.body.whatsapp_inquiry !== undefined) {
      data.whatsapp_inquiry = req.body.whatsapp_inquiry === 'true' || req.body.whatsapp_inquiry === true;
    }
    if (req.body.mrp !== undefined || req.body.mrp_price !== undefined) {
      const val = req.body.mrp || req.body.mrp_price;
      data.mrp_price = val ? parseFloat(val) : null;
    }
    if (req.body.fabric !== undefined) data.fabric = req.body.fabric;
    if (req.body.embroidery !== undefined) data.embroidery = req.body.embroidery;
    if (req.body.wash_care !== undefined) data.wash_care = req.body.wash_care;
    if (req.body.fit_notes !== undefined) data.fit_notes = req.body.fit_notes;
    if (req.body.dispatch_info !== undefined) data.dispatch_info = req.body.dispatch_info;
    if (req.body.highlights !== undefined) data.highlights = req.body.highlights;
    if (req.body.promo_label !== undefined) data.promo_label = req.body.promo_label;


    if (req.files && req.files.length > 0) {
      const uploaded = req.files.map((file) => {
        if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
          return file.path;
        }
        const host = req.get('host') || 'localhost:5000';
        return `${req.protocol}://${host}/uploads/${file.filename}`;
      });
      let existing = [];
      if (req.body.existing_images) {
        try {
          existing = typeof req.body.existing_images === 'string' ? JSON.parse(req.body.existing_images) : req.body.existing_images;
        } catch (_) {}
      }
      let allImgs = [];
      if (req.body.gallery_order) {
        try {
          const order = typeof req.body.gallery_order === 'string' ? JSON.parse(req.body.gallery_order) : req.body.gallery_order;
          let upIdx = 0;
          let exIdx = 0;
          allImgs = order.map((item) => {
            if (item === '__NEW_FILE__' && upIdx < uploaded.length) {
              return uploaded[upIdx++];
            }
            if (item !== '__NEW_FILE__' && existing.includes(item)) {
              return item;
            }
            if (exIdx < existing.length) {
              return existing[exIdx++];
            }
            return item;
          }).filter(Boolean);

          while (upIdx < uploaded.length) allImgs.push(uploaded[upIdx++]);
          while (exIdx < existing.length) {
            if (!allImgs.includes(existing[exIdx])) allImgs.push(existing[exIdx]);
            exIdx++;
          }
        } catch (_) {
          allImgs = [...uploaded, ...existing];
        }
      } else {
        allImgs = [...uploaded, ...existing];
      }
      data.images = allImgs;
      data.image_url = allImgs[0] || null;
    } else if (req.body.images) {
      const parsedImgs = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      if (Array.isArray(parsedImgs)) {
        data.images = parsedImgs;
        data.image_url = parsedImgs[0] || null;
      }
    } else if (req.body.image_url) {
      data.image_url = req.body.image_url;
      data.images = [req.body.image_url];
    }

    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    const parsedSizeStock = typeof size_stock === 'string' ? JSON.parse(size_stock) : size_stock;

    if (parsedSizes) data.sizes = parsedSizes;
    if (parsedSizeStock) data.size_stock = parsedSizeStock;

    const updated = await prisma.$transaction(async (tx) => {
      // If explicit variants provided or size_stock updated, sync variants
      if (parsedSizeStock && typeof parsedSizeStock === 'object') {
        const activeSizesList = Array.isArray(parsedSizes)
          ? parsedSizes.map(s => String(s).toLowerCase().trim())
          : Object.keys(parsedSizeStock).map(s => String(s).toLowerCase().trim());

        // Deactivate variants for sizes removed by admin
        for (const v of existing.variants) {
          if (!activeSizesList.includes(String(v.size).toLowerCase().trim())) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: { is_active: false, stock: 0 },
            });
          }
        }

        for (const [sz, st] of Object.entries(parsedSizeStock)) {
          const existingVariant = existing.variants.find(v => v.size.toLowerCase() === sz.toLowerCase());
          if (existingVariant) {
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                stock: parseInt(st, 10),
                is_active: true,
                ...(price ? { price: parseFloat(price) } : {}),
                ...(req.body.color ? { color: req.body.color } : {}),
              },
            });
          } else {
            const skuPrefix = (name || existing.name).replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'MIR';
            await tx.productVariant.create({
              data: {
                product_id: productId,
                sku: `MIR-${skuPrefix}-${productId}-${sz.toUpperCase()}`,
                barcode: `BAR-${productId}-${sz.toUpperCase()}`,
                size: sz,
                color: req.body.color || 'Default',
                price: price ? parseFloat(price) : existing.price,
                stock: parseInt(st, 10),
                is_active: true,
              },
            });
          }
        }
      }


      // Recompute Product total stock from variants
      const allVariants = await tx.productVariant.findMany({ where: { product_id: productId } });
      const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
      const computedSizeStock = {};
      allVariants.forEach(v => { computedSizeStock[v.size] = (computedSizeStock[v.size] || 0) + v.stock; });

      data.stock = totalStock;
      data.size_stock = computedSizeStock;

      const product = await tx.product.update({
        where: { id: productId },
        data,
        include: { category: true, variants: true },
      });

      return product;
    });

    // Realtime broadcast after DB commit
    emitProductUpdated(updated);
    if (updated.variants && Array.isArray(updated.variants)) {
      updated.variants.forEach(v => {
        emitInventoryUpdated({ variantId: v.id, productId: v.product_id, stock: v.stock, reserved_stock: v.reserved_stock || 0 });
      });
    }

    res.json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    // Check if product is referenced in historical orders or exchanges
    const [orderItemCount, exchangeCount] = await Promise.all([
      prisma.orderItem.count({ where: { product_id: productId } }),
      prisma.returnRequest.count({ where: { product_id: productId } }),
    ]);

    // If product has historical orders/exchanges, soft-archive (is_active = false) to protect order history
    if (orderItemCount > 0 || exchangeCount > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.productVariant.updateMany({
          where: { product_id: productId },
          data: { is_active: false },
        });


      });

      emitProductDeleted({ id: productId });
      emitProductUpdated({ id: productId, is_active: false });


      return res.json({
        success: true,
        archived: true,
        message: 'Product is referenced in historical sales records and was safely archived (deactivated) to protect order history.',
      });
    }

    // Unreferenced product — safe hard delete
    await prisma.$transaction(async (tx) => {
      await tx.wishlist?.deleteMany({ where: { product_id: productId } }).catch(() => {});
      await tx.cartItem?.deleteMany({ where: { product_id: productId } }).catch(() => {});
      await tx.stockNotification?.deleteMany({ where: { product_id: productId } }).catch(() => {});
      await tx.review?.deleteMany({ where: { product_id: productId } }).catch(() => {});

      const variants = await tx.productVariant.findMany({
        where: { product_id: productId },
        select: { id: true },
      });
      const variantIds = variants.map((v) => v.id);

      if (variantIds.length > 0) {
        await tx.inventoryMovement?.deleteMany({ where: { variant_id: { in: variantIds } } }).catch(() => {});
        await tx.productVariant.deleteMany({ where: { product_id: productId } });
      }

      await tx.inventoryMovement?.deleteMany({ where: { product_id: productId } }).catch(() => {});
      await tx.product.delete({ where: { id: productId } });
    });

    // Realtime broadcast after DB commit
    emitProductDeleted(productId);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Error processing product deletion: ' + error.message, error: error.message });
  }
};


