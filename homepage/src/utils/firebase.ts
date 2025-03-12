import { logEvent, setUserProperties } from 'firebase/analytics';
import { db, analytics } from '../firebase.config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Use Firebase instance from firebase.config.ts

// Analytics helper functions
export const trackEvent = (eventName: string, eventParams = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
    console.log(`Analytics event tracked: ${eventName}`, eventParams);
  }
};

// Set user properties for better analytics segmentation
export const setUserProps = (properties = {}) => {
  if (analytics) {
    setUserProperties(analytics, properties);
    console.log('User properties set:', properties);
  }
};

// Firebase collection names
export const COLLECTIONS = {
  TOOLS: 'tools'
};

// Firestore data fetching functions using Analytics data
export const getTopToolsByUsage = async (limit = 10) => {
  try {
    // Fetch tools from Firestore and sort by upvotes
    const toolsRef = collection(db, COLLECTIONS.TOOLS);
    const q = query(toolsRef, orderBy('upvotes', 'desc'));
    const snapshot = await getDocs(q);
    
    const tools = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Convert to usage format and limit
    return tools.slice(0, limit).map(tool => {
      const data = tool as {
        id: string;
        name: string;
        upvotes?: number;
        [key: string]: unknown;
      };
      return {
        toolId: tool.id,
        toolName: data.name || 'Unknown Tool',
        clicks: data.upvotes || 0,
        lastUsed: new Date() // Using current date as placeholder
      };
    });
  } catch (error) {
    console.error('Error fetching top tools:', error);
    return [];
  }
};

// Removed user stats and referral functions as we're only using top tools

// Re-export db for convenience
export { db };