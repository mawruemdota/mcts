import { base44 } from '@/api/base44Client';

/**
 * Notification Service - Handles automated notifications for key events
 */

// Status display names
const STATUS_DISPLAY = {
  pending_approval: 'Pending Approval',
  finalized: 'Finalized',
  in_production: 'In Production',
  quality_check: 'Quality Check',
  ready_pickup: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

/**
 * Send in-app notification
 */
export const sendInAppNotification = async (recipientEmail, message, linkTo = null) => {
  try {
    await base44.entities.Notification.create({
      recipient_email: recipientEmail,
      message,
      link_to: linkTo,
      is_read: false
    });
    return true;
  } catch (error) {
    console.error('Failed to send in-app notification:', error);
    return false;
  }
};

/**
 * Send email notification
 */
export const sendEmailNotification = async (to, subject, body) => {
  try {
    await base44.integrations.Core.SendEmail({
      to,
      subject,
      body
    });
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
};

/**
 * Notify on task status change
 */
export const notifyTaskStatusChange = async (job, oldStatus, newStatus, updatedBy) => {
  const statusDisplay = STATUS_DISPLAY[newStatus] || newStatus;
  const jobLink = `/Dashboard`;
  
  // Notify assigned team member if different from updater
  if (job.assigned_to && job.assigned_to !== updatedBy) {
    await sendInAppNotification(
      job.assigned_to,
      `Task "${job.title}" status changed to ${statusDisplay}`,
      jobLink
    );
  }

  // Send email to client for key status changes
  if (job.client_email && ['ready_pickup', 'completed'].includes(newStatus)) {
    const subject = newStatus === 'ready_pickup' 
      ? `Your order is ready for pickup - ${job.title}`
      : `Your order is complete - ${job.title}`;
    
    const body = newStatus === 'ready_pickup'
      ? `Dear ${job.client_name},\n\nGreat news! Your order "${job.title}" is now ready for pickup.\n\nPlease contact us to arrange pickup or delivery.\n\nThank you for your business!\n\nMCTS Team`
      : `Dear ${job.client_name},\n\nYour order "${job.title}" has been completed.\n\nThank you for choosing MCTS!\n\nBest regards,\nMCTS Team`;

    await sendEmailNotification(job.client_email, subject, body);
  }
};

/**
 * Notify on invoice due/overdue
 */
export const notifyInvoiceDue = async (invoice, isOverdue = false) => {
  if (!invoice.client_email) return;

  const subject = isOverdue 
    ? `Invoice ${invoice.invoice_number} is overdue`
    : `Invoice ${invoice.invoice_number} is due soon`;

  const body = isOverdue
    ? `Dear ${invoice.client_name},\n\nThis is a reminder that Invoice ${invoice.invoice_number} for ₱${invoice.amount?.toFixed(2)} is now overdue.\n\nPlease remit payment at your earliest convenience.\n\nThank you,\nMCTS Team`
    : `Dear ${invoice.client_name},\n\nThis is a friendly reminder that Invoice ${invoice.invoice_number} for ₱${invoice.amount?.toFixed(2)} is due on ${invoice.due_date}.\n\nPlease remit payment before the due date.\n\nThank you,\nMCTS Team`;

  await sendEmailNotification(invoice.client_email, subject, body);
};

/**
 * Notify on purchase order approval needed
 */
export const notifyPurchaseOrderApproval = async (purchaseOrder, approverEmail) => {
  if (!approverEmail) return;

  await sendInAppNotification(
    approverEmail,
    `New Purchase Order ${purchaseOrder.po_number} requires your approval (₱${purchaseOrder.total_amount?.toFixed(2)})`,
    '/Forms'
  );

  // Also send email
  await sendEmailNotification(
    approverEmail,
    `Purchase Order ${purchaseOrder.po_number} Requires Approval`,
    `A new purchase order requires your approval:\n\nPO Number: ${purchaseOrder.po_number}\nSupplier: ${purchaseOrder.supplier_name}\nTotal: ₱${purchaseOrder.total_amount?.toFixed(2)}\n\nPlease review and approve or reject this purchase order.\n\nMCTS System`
  );
};

/**
 * Notify on delivery scheduled
 */
export const notifyDeliveryScheduled = async (delivery, teamEmails = []) => {
  const message = `Delivery ${delivery.delivery_number} scheduled for ${delivery.client_name}`;
  
  // Notify all relevant team members
  for (const email of teamEmails) {
    await sendInAppNotification(email, message, '/Forms');
  }
};

/**
 * Check and send overdue invoice notifications (to be called periodically)
 */
export const checkOverdueInvoices = async () => {
  try {
    const invoices = await base44.entities.Invoice.filter({ status: 'unpaid' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const invoice of invoices) {
      if (!invoice.due_date) continue;
      
      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        // Invoice is overdue
        await notifyInvoiceDue(invoice, true);
        // Update status to overdue
        await base44.entities.Invoice.update(invoice.id, { status: 'overdue' });
      } else if (dueDate.getTime() - today.getTime() <= 3 * 24 * 60 * 60 * 1000) {
        // Due within 3 days
        await notifyInvoiceDue(invoice, false);
      }
    }
  } catch (error) {
    console.error('Error checking overdue invoices:', error);
  }
};

export default {
  sendInAppNotification,
  sendEmailNotification,
  notifyTaskStatusChange,
  notifyInvoiceDue,
  notifyPurchaseOrderApproval,
  notifyDeliveryScheduled,
  checkOverdueInvoices
};