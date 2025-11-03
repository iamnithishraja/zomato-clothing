/**
 * Assignment Scheduler
 * Runs background jobs for automatic order assignment
 * Similar to Zomato's delivery assignment system
 */

import { processUnassignedOrders } from './orderAssignmentService';

let assignmentInterval: NodeJS.Timeout | null = null;

/**
 * Start the background job for order assignment
 * Runs every 60 seconds to check for unassigned orders
 */
export function startAssignmentScheduler(): void {
  if (assignmentInterval) {
    console.log('⚠️ [Assignment Scheduler] Already running');
    return;
  }

  console.log('🚀 [Assignment Scheduler] Starting automatic order assignment service...');

  // Run immediately on start
  processUnassignedOrders();

  // Then run every 60 seconds
  assignmentInterval = setInterval(() => {
    processUnassignedOrders();
  }, 60000); // 60 seconds

  console.log('✅ [Assignment Scheduler] Automatic order assignment service started (runs every 60 seconds)');
}

/**
 * Stop the background job
 */
export function stopAssignmentScheduler(): void {
  if (assignmentInterval) {
    clearInterval(assignmentInterval);
    assignmentInterval = null;
    console.log('🛑 [Assignment Scheduler] Automatic order assignment service stopped');
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): { running: boolean } {
  return {
    running: assignmentInterval !== null
  };
}

