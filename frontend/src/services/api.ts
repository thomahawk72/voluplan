import axios from 'axios';

// In production (Heroku), use relative URL since backend serves frontend
// In development, use full URL from env or default to localhost
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Requests automatically include httpOnly cookies
// No need to manually add Authorization header

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const evt = new Event('session-expired');
      window.dispatchEvent(evt);
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roles: string[];
  talents: string[];
  isActive?: boolean;
  createdAt?: string;
}

export interface UserTalent {
  id: number;
  bruker_id: number;
  talent_id: number;
  talent_navn: string;
  kategori_id: number;
  kategori_navn: string;
  erfaringsnivaa: 'grunnleggende' | 'middels' | 'avansert' | 'ekspert';
  notater?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    // Cookie is cleared by backend
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<{ users: User[] }> => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<{ user: User }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: Partial<User>): Promise<{ user: User }> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: number, userData: Partial<User>): Promise<{ user: User }> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Production types
export interface Produksjon {
  id: number;
  navn: string;
  tid: string;
  kategori_id?: number | null;
  kategori_navn?: string;
  publisert: boolean;
  beskrivelse?: string | null;
  plan_id?: number | null;
  antall_personer?: number;
  plassering?: string | null;
}

export interface Bemanning {
  id: number;
  produksjon_id: number;
  person_id: number;
  talent_id: number;
  first_name: string;
  last_name: string;
  email: string;
  talent_navn: string;
  talent_kategori: string;
  notater: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProduksjonsPlan {
  id: number;
  navn: string;
  beskrivelse: string | null;
  start_dato: string | null;
  slutt_dato: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentKategori {
  id: number;
  navn: string;
  parent_id: number | null;
  beskrivelse: string | null;
  level?: number;
  path?: string;
  created_at: string;
  updated_at: string;
}

export interface Talent {
  id: number;
  navn: string;
  kategori_id: number;
  leder_id: number | null;
  beskrivelse: string | null;
  kategori_navn?: string;
  kategori_parent_id?: number | null;
  leder_first_name?: string;
  leder_last_name?: string;
  leder_email?: string;
  created_at: string;
  updated_at: string;
}

export interface ProduksjonsKategoriTalentMal {
  id: number;
  kategori_id: number;
  talent_id: number;
  talent_navn: string;
  talent_kategori: string;
  antall: number;
  beskrivelse: string | null;
  created_at: string;
  updated_at: string;
}

// Production API
export const produksjonAPI = {
  getAll: async (filters?: { 
    kategoriId?: number; 
    planId?: number; 
    publisert?: boolean;
    kommende?: boolean;
    gjennomfort?: boolean;
  }): Promise<{ produksjoner: Produksjon[] }> => {
    const params = new URLSearchParams();
    if (filters?.kategoriId) params.append('kategoriId', String(filters.kategoriId));
    if (filters?.planId) params.append('planId', String(filters.planId));
    if (filters?.publisert !== undefined) params.append('publisert', String(filters.publisert));
    if (filters?.kommende) params.append('kommende', 'true');
    if (filters?.gjennomfort) params.append('gjennomfort', 'true');
    
    const response = await api.get(`/produksjon?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<{ produksjon: Produksjon }> => {
    const response = await api.get(`/produksjon/${id}`);
    return response.data;
  },

  getBemanning: async (id: number): Promise<{ bemanning: Bemanning[] }> => {
    const response = await api.get(`/produksjon/${id}/bemanning`);
    return response.data;
  },

  getPlan: async (id: number): Promise<{ plan: ProduksjonsPlan }> => {
    const response = await api.get(`/produksjon/planer/${id}`);
    return response.data;
  },

  // Produksjonskategori talent-mal
  getTalentMal: async (kategoriId: number): Promise<{ talentMal: ProduksjonsKategoriTalentMal[] }> => {
    const response = await api.get(`/produksjon/kategorier/${kategoriId}/talent-mal`);
    return response.data;
  },

  addTalentToMal: async (kategoriId: number, data: { talentId: number; antall?: number; beskrivelse?: string }): Promise<{ talentMal: ProduksjonsKategoriTalentMal }> => {
    const response = await api.post(`/produksjon/kategorier/${kategoriId}/talent-mal`, data);
    return response.data;
  },

  updateTalentInMal: async (kategoriId: number, malId: number, data: { antall?: number; beskrivelse?: string }): Promise<{ talentMal: ProduksjonsKategoriTalentMal }> => {
    const response = await api.put(`/produksjon/kategorier/${kategoriId}/talent-mal/${malId}`, data);
    return response.data;
  },

  removeTalentFromMal: async (kategoriId: number, malId: number): Promise<void> => {
    await api.delete(`/produksjon/kategorier/${kategoriId}/talent-mal/${malId}`);
  },

  // Kategorier
  getAllKategorier: async (): Promise<{ kategorier: any[] }> => {
    const response = await api.get('/produksjon/kategorier');
    return response.data;
  },

  getKategori: async (id: number): Promise<{ kategori: any }> => {
    const response = await api.get(`/produksjon/kategorier/${id}`);
    return response.data;
  },

  updateKategori: async (id: number, data: { navn?: string; beskrivelse?: string; plassering?: string }): Promise<{ kategori: any }> => {
    const response = await api.put(`/produksjon/kategorier/${id}`, data);
    return response.data;
  },

  createProduksjon: async (data: { 
    navn: string; 
    tid: string; 
    kategoriId?: number; 
    publisert?: boolean; 
    beskrivelse?: string; 
    planId?: number;
    applyTalentMal?: boolean;
    plassering?: string;
  }): Promise<{ produksjon: Produksjon; talentMal?: ProduksjonsKategoriTalentMal[] }> => {
    const response = await api.post('/produksjon', data);
    return response.data;
  },

  updateProduksjon: async (id: number, data: {
    navn?: string;
    tid?: string;
    kategoriId?: number;
    publisert?: boolean;
    beskrivelse?: string;
    planId?: number;
    plassering?: string;
  }): Promise<{ produksjon: Produksjon }> => {
    const response = await api.put(`/produksjon/${id}`, data);
    return response.data;
  },
};

// Talent API
export const talentAPI = {
  // Kategorier
  getAllKategorier: async (): Promise<{ kategorier: TalentKategori[] }> => {
    const response = await api.get('/kompetanse/kategorier');
    return response.data;
  },

  createKategori: async (data: { navn: string; parentId?: number; beskrivelse?: string }): Promise<{ kategori: TalentKategori }> => {
    const response = await api.post('/kompetanse/kategorier', data);
    return response.data;
  },

  updateKategori: async (id: number, data: { navn?: string; parentId?: number; beskrivelse?: string }): Promise<{ kategori: TalentKategori }> => {
    const response = await api.put(`/kompetanse/kategorier/${id}`, data);
    return response.data;
  },

  deleteKategori: async (id: number): Promise<void> => {
    await api.delete(`/kompetanse/kategorier/${id}`);
  },

  // Talenter
  getAll: async (): Promise<{ kompetanser: Talent[] }> => {
    const response = await api.get('/kompetanse');
    return response.data;
  },

  create: async (data: { navn: string; kategoriId: number; lederId?: number; beskrivelse?: string }): Promise<{ kompetanse: Talent }> => {
    const response = await api.post('/kompetanse', data);
    return response.data;
  },

  update: async (id: number, data: { navn?: string; kategoriId?: number; lederId?: number; beskrivelse?: string }): Promise<{ kompetanse: Talent }> => {
    const response = await api.put(`/kompetanse/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/kompetanse/${id}`);
  },
};

// User API
export const userAPI = {
  getAll: async (): Promise<{ users: User[] }> => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<{ user: User }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    roles?: string[];
    isActive?: boolean;
  }): Promise<{ user: User }> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: number, userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    currentPassword?: string;
    phoneNumber?: string;
    roles?: string[];
    isActive?: boolean;
  }): Promise<{ user: User }> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  bulkDelete: async (userIds: number[]): Promise<{ message: string; deletedIds: number[] }> => {
    const response = await api.post('/users/bulk-delete', { userIds });
    return response.data;
  },

  // Bruker-talent relasjoner
  getUserTalents: async (userId: number): Promise<{ talents: UserTalent[] }> => {
    const response = await api.get(`/users/${userId}/talents`);
    return response.data;
  },

  addUserTalent: async (userId: number, talentData: {
    talentId: number;
    erfaringsnivaa?: 'grunnleggende' | 'middels' | 'avansert' | 'ekspert';
    notater?: string;
  }): Promise<{ talent: UserTalent }> => {
    const response = await api.post(`/users/${userId}/talents`, talentData);
    return response.data;
  },

  updateUserTalent: async (userId: number, talentId: number, talentData: {
    erfaringsnivaa?: 'grunnleggende' | 'middels' | 'avansert' | 'ekspert';
    notater?: string;
  }): Promise<{ talent: UserTalent }> => {
    const response = await api.put(`/users/${userId}/talents/${talentId}`, talentData);
    return response.data;
  },

  removeUserTalent: async (userId: number, talentId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${userId}/talents/${talentId}`);
    return response.data;
  },
};

export default api;

