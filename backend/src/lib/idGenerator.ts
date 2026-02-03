import prisma from "./prisma";

/**
 * Generate a unique Order ID that contains only numbers and hyphens
 * Format: YYYYMMDD-HHMMSS-MMMRRRRRRR
 * Where MMM = milliseconds (0-999) and RRRRRRR = 7-digit random number
 * Example: 20260203-193302-4567894521
 * 
 * This format ensures high uniqueness:
 * - Timestamp includes milliseconds (1000 possibilities per second)
 * - Plus random 7-digit component (10 million possibilities)
 * - Total: 10 billion unique combinations per second
 * 
 * Additionally, if collision is detected, it retries with a new random component
 */

const generateRandomOrderId = (): string => {
  const now = new Date();
  
  // Format: YYYYMMDD
  const date = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  
  // Format: HHMMSS
  const time = String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  
  // Milliseconds (000-999)
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  // Random 7-digit number (0000000-9999999)
  const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  
  return `${date}-${time}-${milliseconds}${random}`;
};

/**
 * Generate a unique Order ID with collision detection
 * Retries up to 5 times if collision is detected
 */
export const generateOrderId = async (): Promise<string> => {
  const MAX_RETRIES = 5;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const orderId = generateRandomOrderId();
    
    // Check if this ID already exists in the database
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
    
    if (!existingOrder) {
      return orderId; // ID is unique, return it
    }
    
    // Collision detected, retry with a small delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  }
  
  throw new Error('Failed to generate unique Order ID after maximum retries');
};
