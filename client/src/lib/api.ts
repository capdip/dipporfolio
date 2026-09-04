import type {
  ApiResponse,
  AuthSuccess,
  BlogPost,
  Conference,
  ContactMessage,
  ContactSubmissionInput,
  CvFile,
  Education,
  Experience,
  Hobby,
  Internship,
  Language,
  MediaItem,
  Membership,
  Project,
  Publication,
  PublicUser,
  Recommendation,
  Research,
  ResearchExperience,
  SiteSettings,
  Skill,
  Training,
} from '../../../shared/types';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || 'https://dipporfolio1-orpin.vercel.app/')
    .replace(/\/$/, '') + '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type QueryParams = Record<string, string | number | boolean | undefined>;

class ApiClient {
  private baseUrl = API_BASE_URL;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const token = localStorage.getItem('auth_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    let body: ApiResponse<unknown> | null = null;
    try {
      body = (await response.json()) as ApiResponse<unknown>;
    } catch {
      /* non-JSON response */
    }

    if (!response.ok) {
      // An expired/invalid session should never leave the admin UI in a broken
      // state (e.g. "Failed to load CV versions") — drop the stale token so the
      // app falls back to the login screen on the next render/navigation.
      if (response.status === 401 && localStorage.getItem('auth_token')) {
        localStorage.removeItem('auth_token');
        window.dispatchEvent(new Event('auth:logout'));
      }
      const message =
        body?.error?.message ?? `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, body?.error?.details);
    }
    
    // Handle responses that don't have the { data: ... } wrapper
    if (body && typeof body === 'object' && 'data' in body) {
      return (body.data as T);
    }
    // For singleton endpoints that return data directly
    return body as T;
  }

  private unwrapList<T>(result: { data?: T[] } | T[]): T[] {
    if (Array.isArray(result)) return result;
    return result.data ?? [];
  }

  get token(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string | null): void {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  async healthCheck(): Promise<{
    status: string;
    storage: string;
    database: string;
    mongoUri?: string;
    error?: string;
    vercelEnv?: string;
  }> {
    return this.request('/health');
  }

  /* ---------------- Auth ---------------- */

  async login(email: string, password: string): Promise<AuthSuccess> {
    const result = await this.request<AuthSuccess>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async me(): Promise<PublicUser> {
    // Server responds { success, data: { user } }; request() already unwraps `data`.
    const result = await this.request<{ user: PublicUser }>('/auth/me');
    return result.user;
  }

  async updateUser(id: string, input: { name?: string; password?: string }): Promise<unknown> {
    const result = await this.request(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return result;
  }

  /* ---------------- Generic content resources ---------------- */

  async getList<T>(resource: string, params?: QueryParams): Promise<T[]> {
    const query = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    const result = await this.request<{ data?: T[] }>(`/${resource}${query ? `?${query}` : ''}`);
    return this.unwrapList<T>(result);
  }

  async getAllIncludingHidden<T>(resource: string): Promise<T[]> {
    const result = await this.request<{ data?: T[] }>(`/${resource}/all`);
    return this.unwrapList<T>(result);
  }

  async getById<T>(resource: string, id: string): Promise<T> {
    // request() already unwraps the { success, data } envelope.
    const result = await this.request<T>(`/${resource}/${id}`);
    if (result === undefined || result === null) {
      throw new ApiError('Not found', 404);
    }
    return result;
  }

  async create<T>(resource: string, payload: Partial<T>): Promise<T> {
    const result = await this.request<T>(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result;
  }

  async update<T>(resource: string, id: string, payload: Partial<T>): Promise<T> {
    const result = await this.request<T>(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return result;
  }

  async patch(resource: string, id: string, partial: Record<string, unknown>): Promise<unknown> {
    const result = await this.request(`/${resource}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial),
    });
    return result;
  }

  async remove(resource: string, id: string): Promise<void> {
    await this.request(`/${resource}/${id}`, { method: 'DELETE' });
  }

  async reorder(resource: string, ids: string[]): Promise<void> {
    await this.request(`/${resource}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  /* ---------------- Singletons ---------------- */

  async getAbout(): Promise<import('../../../shared/types').AboutContent | null> {
    try {
      return await this.request<import('../../../shared/types').AboutContent | null>('/about');
    } catch {
      return null;
    }
  }

  async saveAbout(payload: Partial<import('../../../shared/types').AboutContent>) {
    return this.request('/about', { method: 'PUT', body: JSON.stringify(payload) });
  }

  async getSettings(): Promise<SiteSettings | null> {
    try {
      return await this.request<SiteSettings | null>('/settings');
    } catch {
      return null;
    }
  }

  async saveSettings(payload: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.request<SiteSettings>('/settings', { method: 'PUT', body: JSON.stringify(payload) });
  }

  /* ---------------- Typed convenience wrappers ---------------- */

  getEducation: () => Promise<Education[]> = () => this.getList('education');
  getProjects: (params?: QueryParams) => Promise<Project[]> = (params) => this.getList('projects', params);
  getProject: (id: string) => Promise<Project> = (id) => this.getById('projects', id);
  getPublications: (params?: QueryParams) => Promise<Publication[]> = (params) =>
    this.getList('publications', params);
  getPublication: (id: string) => Promise<Publication> = (id) => this.getById('publications', id);
  getResearch: () => Promise<Research[]> = () => this.getList('research');
  getExperience: () => Promise<Experience[]> = () => this.getList('experience');
  getInternships: () => Promise<Internship[]> = () => this.getList('internships');
  getResearchExperience: () => Promise<ResearchExperience[]> = () => this.getList('research-experience');
  getSkills: () => Promise<Skill[]> = () => this.getList('skills');
  getConferences: (params?: QueryParams) => Promise<Conference[]> = (params) =>
    this.getList('conferences', params);
  getTraining: () => Promise<Training[]> = () => this.getList('training');
  getMemberships: () => Promise<Membership[]> = () => this.getList('memberships');
  getLanguages: () => Promise<Language[]> = () => this.getList('languages');
  getHobbies: () => Promise<Hobby[]> = () => this.getList('hobbies');
  getRecommendations: () => Promise<Recommendation[]> = () => this.getList('recommendations');
  getBlogPosts: (params?: QueryParams) => Promise<BlogPost[]> = (params) =>
    this.getList('blog', params);
  getBlogPostBySlug: (slug: string) => Promise<BlogPost> = (slug) => this.getById('blog', slug);

  /* ---------------- Contact ---------------- */

  async submitContact(input: ContactSubmissionInput): Promise<void> {
    await this.request('/contact', { method: 'POST', body: JSON.stringify(input) });
  }

  async getContactMessages(params?: QueryParams): Promise<ContactMessage[]> {
    const query = params
      ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))}`
      : '';
    const result = await this.request<{ data?: ContactMessage[] }>(`/contact${query}`);
    return this.unwrapList(result);
  }

  /* ---------------- Media ---------------- */

  async getMedia(params?: QueryParams): Promise<MediaItem[]> {
    const result = await this.request<{ data?: MediaItem[] }>(
      `/media${params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))}` : ''}`
    );
    return this.unwrapList(result);
  }

  async uploadMedia(file: File, metadata: Record<string, unknown>): Promise<MediaItem> {
    const form = new FormData();
    form.append('file', file);
    form.append('metadata', JSON.stringify(metadata));
    const result = await this.request<{ data: MediaItem }>('/media', {
      method: 'POST',
      body: form,
    });
    return result.data;
  }

  /* ---------------- CV ---------------- */

  async getCvVersions(): Promise<CvFile[]> {
    const result = await this.request<{ data?: CvFile[] }>('/cv');
    return this.unwrapList(result);
  }

  async uploadCv(file: File, metadata: { label: string; isPublic: boolean; notes?: string }): Promise<CvFile> {
    const form = new FormData();
    form.append('file', file);
    form.append('metadata', JSON.stringify(metadata));
    const result = await this.request<{ data: CvFile }>('/cv', { method: 'POST', body: form });
    return result.data;
  }

  async getCvDownloadUrl(): Promise<string> {
    return `${API_BASE_URL}/cv/download`;
  }

  /* ---------------- Audit ---------------- */

  async getAuditLogs(params?: QueryParams): Promise<Array<Record<string, unknown>>> {
    const result = await this.request<{ data?: Array<Record<string, unknown>> }>(
      `/audit-logs${params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))}` : ''}`
    );
    return this.unwrapList(result);
  }
}

export const api = new ApiClient();
