
import { db } from './db';

const DEVICE_ID_KEY = 'deviceId';

export async function getDeviceId(): Promise<string> {
  try {
    const existingId = await db.meta.get(DEVICE_ID_KEY);
    if (existingId) {
      return existingId.value;
    }
    
    const newId = crypto.randomUUID();
    await db.meta.put({ key: DEVICE_ID_KEY, value: newId });
    return newId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return crypto.randomUUID(); // Fallback to temporary ID
  }
}
