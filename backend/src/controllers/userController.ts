import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middlewares/requireAuth";
import * as cartService from "../services/cartService";

export const syncUser = async (req: AuthRequest, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;  // Get uid from decoded Firebase token, not firebaseUid
    const { name, email, phone } = req.body;

    console.log("Sync user called:", { firebaseUid, name, email, phone });

    if (!firebaseUid) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    console.log("Found existing user:", user);

    if (user) {
      // Update existing user only if name, email, or phone is provided AND not null/empty
      const updateData: any = {};
      
      // Only update email if provided and not empty
      if (email && email.trim()) {
        updateData.email = email;
      }
      
      // Only update name if provided and not empty (don't overwrite with null)
      if (name && name.trim()) {
        updateData.name = name;
      }
      
      // Only update phone if provided and not empty
      if (phone && phone.trim()) {
        updateData.phone = phone;
      }
      
      console.log("Update data:", updateData);
      
      // Update only if there's data to update
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { firebaseUid },
          data: updateData
        });
        console.log("User updated:", user);
      }
    } else {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email: email || "",
          name: (name && name.trim()) ? name : null,
          phone: (phone && phone.trim()) ? phone : null
        }
      });
      console.log("User created:", user);
    }

    res.json(user);
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ message: "Failed to sync user" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    const { name, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone })
      }
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const addAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { name, phone, address, city, pincode, state } = req.body;

    if (!name || !phone || !address || !city || !pincode) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    const savedAddress = await prisma.address.create({
      data: {
        userId,
        name,
        phone,
        address,
        city,
        pincode,
        state: state || null
      }
    });

    res.status(201).json(savedAddress);
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Failed to add address" });
  }
};

export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(addresses);
  } catch (error) {
    console.error("Error getting addresses:", error);
    res.status(500).json({ message: "Failed to get addresses" });
  }
};

export const setDefaultAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!id) {
      return res.status(400).json({ message: "Address ID is required" });
    }

    // Verify address belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress || existingAddress.userId !== userId) {
      return res.status(403).json({ message: "Address not found or unauthorized" });
    }

    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false }
    });

    const address = await prisma.address.update({
      where: { id },
      data: { isDefault: true }
    });

    res.json(address);
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!id) {
      return res.status(400).json({ message: "Address ID is required" });
    }

    // Verify address belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress || existingAddress.userId !== userId) {
      return res.status(403).json({ message: "Address not found or unauthorized" });
    }

    await prisma.address.delete({ where: { id } });
    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
};

export const checkEmailExists = async (req: any, res: Response) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findFirst({
      where: { email: String(email) }
    });

    res.json({ exists: !!user });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "Failed to check email" });
  }
};

export const checkPhoneExists = async (req: any, res: Response) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const user = await prisma.user.findFirst({
      where: { phone: String(phone) }
    });

    res.json({ exists: !!user });
  } catch (error) {
    console.error("Error checking phone:", error);
    res.status(500).json({ message: "Failed to check phone" });
  }
};

export const getCheckoutData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" }
    });

    const cartData = await cartService.getCartWithTotals(userId);

    res.json({
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        phone: user?.phone
      },
      addresses,
      cart: cartData
    });
  } catch (error) {
    console.error("Error getting checkout data:", error);
    res.status(500).json({ message: "Failed to get checkout data" });
  }
};
