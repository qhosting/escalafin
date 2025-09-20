
import { Client, ClientStatus, EmploymentType, User, Loan, CreditApplication } from '@prisma/client';

export interface CreateClientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  monthlyIncome?: number;
  employmentType?: EmploymentType;
  employerName?: string;
  workAddress?: string;
  yearsEmployed?: number;
  creditScore?: number;
  bankName?: string;
  accountNumber?: string;
  asesorId?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  status?: ClientStatus;
}

export interface ClientWithDetails extends Client {
  user?: User | null;
  asesor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  loans?: {
    id: string;
    loanNumber: string;
    principalAmount: number;
    balanceRemaining: number;
    status: string;
    startDate: Date;
    endDate: Date;
  }[];
  creditApplications?: {
    id: string;
    loanType: string;
    requestedAmount: number;
    status: string;
    createdAt: Date;
  }[];
}

// API functions
export const createClient = async (data: CreateClientData): Promise<Client> => {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error creating client');
  }

  return response.json();
};

export const getClients = async (filters?: {
  status?: ClientStatus;
  asesorId?: string;
  searchTerm?: string;
}): Promise<ClientWithDetails[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.asesorId) params.append('asesorId', filters.asesorId);
  if (filters?.searchTerm) params.append('search', filters.searchTerm);

  const response = await fetch(`/api/clients?${params}`);
  
  if (!response.ok) {
    throw new Error('Error fetching clients');
  }

  return response.json();
};

export const getClientById = async (id: string): Promise<ClientWithDetails> => {
  const response = await fetch(`/api/clients/${id}`);
  
  if (!response.ok) {
    throw new Error('Error fetching client');
  }

  return response.json();
};

export const updateClient = async (id: string, data: UpdateClientData): Promise<Client> => {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error updating client');
  }

  return response.json();
};

export const deleteClient = async (id: string): Promise<void> => {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error deleting client');
  }
};

// Utility functions
export const getClientStatusLabel = (status: ClientStatus): string => {
  const statusLabels = {
    [ClientStatus.ACTIVE]: 'Activo',
    [ClientStatus.INACTIVE]: 'Inactivo',
    [ClientStatus.BLACKLISTED]: 'Lista Negra',
  };
  return statusLabels[status];
};

export const getClientStatusColor = (status: ClientStatus): string => {
  const statusColors = {
    [ClientStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [ClientStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
    [ClientStatus.BLACKLISTED]: 'bg-red-100 text-red-800',
  };
  return statusColors[status];
};

export const getEmploymentTypeLabel = (employmentType: EmploymentType): string => {
  const employmentTypeLabels = {
    [EmploymentType.EMPLOYED]: 'Empleado',
    [EmploymentType.SELF_EMPLOYED]: 'Independiente',
    [EmploymentType.UNEMPLOYED]: 'Desempleado',
    [EmploymentType.RETIRED]: 'Jubilado',
    [EmploymentType.STUDENT]: 'Estudiante',
  };
  return employmentTypeLabels[employmentType];
};
