
import { PersonalReference, RelationshipType, NotificationPreference } from '@prisma/client';

export interface CreatePersonalReferenceData {
  clientId: string;
  fullName: string;
  relationship: RelationshipType;
  relationshipOther?: string;
  phone: string;
  address?: string;
  notificationPreference?: NotificationPreference;
}

export interface UpdatePersonalReferenceData {
  fullName?: string;
  relationship?: RelationshipType;
  relationshipOther?: string;
  phone?: string;
  address?: string;
  notificationPreference?: NotificationPreference;
}

export interface PersonalReferenceWithClient extends PersonalReference {
  client: {
    firstName: string;
    lastName: string;
  };
}

// API functions
export const createPersonalReference = async (data: CreatePersonalReferenceData): Promise<PersonalReferenceWithClient> => {
  const response = await fetch('/api/personal-references', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error creating personal reference');
  }

  return response.json();
};

export const getPersonalReferences = async (clientId: string): Promise<PersonalReference[]> => {
  const response = await fetch(`/api/personal-references?clientId=${clientId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error fetching personal references');
  }

  return response.json();
};

export const updatePersonalReference = async (id: string, data: UpdatePersonalReferenceData): Promise<PersonalReferenceWithClient> => {
  const response = await fetch(`/api/personal-references/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error updating personal reference');
  }

  return response.json();
};

export const deletePersonalReference = async (id: string): Promise<void> => {
  const response = await fetch(`/api/personal-references/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error deleting personal reference');
  }
};

// Utility functions
export const getRelationshipTypeLabel = (relationship: RelationshipType): string => {
  const relationshipLabels = {
    [RelationshipType.FAMILY]: 'Familia',
    [RelationshipType.FRIEND]: 'Amigo/a',
    [RelationshipType.COWORKER]: 'Compañero/a de trabajo',
    [RelationshipType.NEIGHBOR]: 'Vecino/a',
    [RelationshipType.OTHER]: 'Otro',
  };
  return relationshipLabels[relationship];
};

export const getNotificationPreferenceLabel = (preference: NotificationPreference): string => {
  const preferenceLabels = {
    [NotificationPreference.SMS]: 'SMS',
    [NotificationPreference.WHATSAPP]: 'WhatsApp',
    [NotificationPreference.BOTH]: 'SMS y WhatsApp',
    [NotificationPreference.NONE]: 'Sin notificaciones',
  };
  return preferenceLabels[preference];
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Validate Mexican phone number format
  const phoneRegex = /^(\+52\s?)?(\d{10})$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  // Format phone number for display
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+52')) {
    const number = cleaned.slice(3);
    return `+52 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};
