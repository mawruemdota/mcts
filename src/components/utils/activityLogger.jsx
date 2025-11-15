import { base44 } from '@/api/base44Client';

/**
 * Utility for logging user activities in the app
 */

export const logActivity = async (action_type, entity_type, entity_id, entity_name, details = {}) => {
  try {
    const user = await base44.auth.me();
    
    await base44.entities.ActivityLog.create({
      action_type,
      entity_type,
      entity_id,
      entity_name,
      user_email: user.email,
      user_name: user.nickname || user.full_name,
      details,
      description: generateDescription(action_type, entity_type, entity_name, details)
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const generateDescription = (action_type, entity_type, entity_name, details) => {
  switch (action_type) {
    case 'created':
      return `Created ${entity_type}: ${entity_name}`;
    case 'updated':
      return `Updated ${entity_type}: ${entity_name}`;
    case 'deleted':
      return `Deleted ${entity_type}: ${entity_name}`;
    case 'status_changed':
      return `Changed status of ${entity_type} "${entity_name}" from ${details.old_status || 'unknown'} to ${details.new_status || 'unknown'}`;
    case 'assigned':
      return `Assigned ${entity_type} "${entity_name}" to ${details.assignee_name || 'someone'}`;
    default:
      return `Performed ${action_type} on ${entity_type}: ${entity_name}`;
  }
};

/**
 * Wrapper functions for common CRUD operations with automatic logging
 */

export const createWithLog = async (entityName, data, displayName = null) => {
  const result = await base44.entities[entityName].create(data);
  const name = displayName || data.title || data.name || data.client_name || data.item_name || 'Item';
  await logActivity('created', entityName, result.id, name);
  return result;
};

export const updateWithLog = async (entityName, entityId, data, displayName, oldData = {}) => {
  const result = await base44.entities[entityName].update(entityId, data);
  
  // Check if status changed
  if (oldData.status && data.status && oldData.status !== data.status) {
    await logActivity('status_changed', entityName, entityId, displayName, {
      old_status: oldData.status,
      new_status: data.status
    });
  } else {
    await logActivity('updated', entityName, entityId, displayName);
  }
  
  return result;
};

export const deleteWithLog = async (entityName, entityId, displayName) => {
  await base44.entities[entityName].delete(entityId);
  await logActivity('deleted', entityName, entityId, displayName);
};

export const assignWithLog = async (entityName, entityId, data, displayName, assigneeName) => {
  const result = await base44.entities[entityName].update(entityId, data);
  await logActivity('assigned', entityName, entityId, displayName, { assignee_name: assigneeName });
  return result;
};