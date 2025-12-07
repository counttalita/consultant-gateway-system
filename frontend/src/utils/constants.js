/**
 * Application constants
 */

export const ROLES = {
  CONSULTANT: 'consultant',
  ADMIN: 'admin',
  FINANCE: 'finance',
  USER: 'user',
};

export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  PARTIALLY_AVAILABLE: 'partially_available',
  UNAVAILABLE: 'unavailable',
};

export const ONBOARDING_STEPS = {
  PERSONAL_INFO: 'personal_info',
  BANKING: 'banking',
  SKILLS: 'skills',
  CONTRACT: 'contract',
  WELCOME: 'welcome',
};

export const BID_DECISIONS = {
  PENDING: 'pending',
  PURSUE: 'pursue',
  DECLINE: 'decline',
};

export const PROJECT_STATUS = {
  SETUP: 'setup',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const INTEGRATION_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  DOWN: 'down',
};

export const ERROR_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const RETRY_DELAY_BASE = 1000; // 1 second
