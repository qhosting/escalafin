
import { CreditApplication, ApplicationStatus, LoanType } from '@prisma/client';

export interface CreateCreditApplicationData {
  clientId: string;
  loanType: LoanType;
  requestedAmount: number;
  requestedTerm: number;
  purpose: string;
}

export interface ReviewCreditApplicationData {
  status: ApplicationStatus;
  reviewComments?: string;
  approvedAmount?: number;
  approvedTerm?: number;
  interestRate?: number;
}

export interface CreditApplicationWithClient extends CreditApplication {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    monthlyIncome: number | null;
    creditScore: number | null;
    dateOfBirth?: Date | null;
    address?: string | null;
    city?: string | null;
    employmentType?: string | null;
    employerName?: string | null;
    workAddress?: string | null;
    yearsEmployed?: number | null;
    bankName?: string | null;
  };
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewedByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  loan?: {
    id: string;
    loanNumber: string;
    status: string;
  } | null;
}

// API functions
export const createCreditApplication = async (data: CreateCreditApplicationData): Promise<CreditApplication> => {
  const response = await fetch('/api/credit-applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error creating credit application');
  }

  return response.json();
};

export const getCreditApplications = async (filters?: {
  status?: ApplicationStatus;
  clientId?: string;
  asesorId?: string;
}): Promise<CreditApplicationWithClient[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.clientId) params.append('clientId', filters.clientId);
  if (filters?.asesorId) params.append('asesorId', filters.asesorId);

  const response = await fetch(`/api/credit-applications?${params}`);
  
  if (!response.ok) {
    throw new Error('Error fetching credit applications');
  }

  return response.json();
};

export const getCreditApplicationById = async (id: string): Promise<CreditApplicationWithClient> => {
  const response = await fetch(`/api/credit-applications/${id}`);
  
  if (!response.ok) {
    throw new Error('Error fetching credit application');
  }

  return response.json();
};

export const reviewCreditApplication = async (id: string, data: ReviewCreditApplicationData): Promise<CreditApplication> => {
  const response = await fetch(`/api/credit-applications/${id}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error reviewing credit application');
  }

  return response.json();
};

export const deleteCreditApplication = async (id: string): Promise<void> => {
  const response = await fetch(`/api/credit-applications/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error deleting credit application');
  }
};

// Utility functions
export const getApplicationStatusLabel = (status: ApplicationStatus): string => {
  const statusLabels = {
    [ApplicationStatus.PENDING]: 'Pendiente',
    [ApplicationStatus.UNDER_REVIEW]: 'En Revisión',
    [ApplicationStatus.APPROVED]: 'Aprobada',
    [ApplicationStatus.REJECTED]: 'Rechazada',
    [ApplicationStatus.CANCELLED]: 'Cancelada',
  };
  return statusLabels[status];
};

export const getApplicationStatusColor = (status: ApplicationStatus): string => {
  const statusColors = {
    [ApplicationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ApplicationStatus.UNDER_REVIEW]: 'bg-blue-100 text-blue-800',
    [ApplicationStatus.APPROVED]: 'bg-green-100 text-green-800',
    [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800',
    [ApplicationStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  };
  return statusColors[status];
};

export const getLoanTypeLabel = (loanType: LoanType): string => {
  const loanTypeLabels = {
    [LoanType.PERSONAL]: 'Préstamo Personal',
    [LoanType.BUSINESS]: 'Préstamo Empresarial',
    [LoanType.MORTGAGE]: 'Hipoteca',
    [LoanType.AUTO]: 'Préstamo Automotriz',
    [LoanType.EDUCATION]: 'Préstamo Educativo',
  };
  return loanTypeLabels[loanType];
};
