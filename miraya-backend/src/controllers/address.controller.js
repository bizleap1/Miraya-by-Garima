import prisma from '../prisma/client.js';

export const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { user_id: req.user.id },
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses', error: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { line1, city, state, pincode, phone } = req.body;
    const address = await prisma.address.create({
      data: {
        user_id: req.user.id,
        line1,
        city,
        state,
        pincode,
        phone,
      },
    });
    res.status(201).json({ message: 'Address saved', address });
  } catch (error) {
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId)) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (address.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this address' });
    }

    await prisma.address.delete({ where: { id: addressId } });
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
};
