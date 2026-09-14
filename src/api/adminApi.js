import axios from 'axios';

const isDebugLoggingEnabled = () => {
  return import.meta.env.DEV || import.meta.env.VITE_API_DEBUG_LOGGING === "true";
};

const generateCorrelationId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "c-admin-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now().toString(36);
};

const SENSITIVE_KEYS = new Set([
  "password", "confirmpassword", "currentpassword", "newpassword",
  "token", "accesstoken", "refreshtoken", "jwt", "authorization",
  "cookie", "secret", "apikey", "clientsecret", "privatekey"
]);

const sanitizePayload = (data, depth = 0) => {
  if (data == null || depth > 5) return data;
  if (typeof data === "string") {
    if (data.length > 50000) {
      return data.substring(0, 2000) + `... [TRUNCATED originalLength=${data.length}]`;
    }
    return data;
  }
  if (typeof data !== "object") return data;
  if (typeof FormData !== "undefined" && data instanceof FormData) return "[FormData payload]";
  if (typeof Blob !== "undefined" && data instanceof Blob) return `[Blob size=${data.size} type=${data.type}]`;
  if (Array.isArray(data)) {
    return data.slice(0, 100).map((item) => sanitizePayload(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizePayload(value, depth + 1);
    }
  }
  return sanitized;
};

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token and correlation ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const correlationId = config.headers['X-Correlation-Id'] || generateCorrelationId();
  config.headers['X-Correlation-Id'] = correlationId;
  config.metadata = { startTime: Date.now(), correlationId };

  if (isDebugLoggingEnabled()) {
    try {
      console.groupCollapsed(`[ADMIN API REQUEST] ${config.method?.toUpperCase()} ${config.url} (corr: ${correlationId})`);
      console.log({
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
        body: sanitizePayload(config.data),
        correlationId,
        timestamp: new Date().toISOString()
      });
      console.groupEnd();
    } catch {
      // safe fallback
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const durationMs = response.config?.metadata?.startTime
      ? Date.now() - response.config.metadata.startTime
      : 0;
    const correlationId = response.headers?.['x-correlation-id'] || response.config?.metadata?.correlationId;

    if (isDebugLoggingEnabled()) {
      try {
        console.groupCollapsed(`[ADMIN API RESPONSE] ${response.config?.method?.toUpperCase()} ${response.config?.url} → ${response.status} (${durationMs}ms) [corr: ${correlationId}]`);
        console.log({
          method: response.config?.method?.toUpperCase(),
          url: response.config?.url,
          status: response.status,
          durationMs,
          correlationId,
          data: sanitizePayload(response.data)
        });
        console.groupEnd();
      } catch {
        // safe fallback
      }
    }

    return response;
  },
  (error) => {
    const originalRequest = error.config;
    const durationMs = originalRequest?.metadata?.startTime
      ? Date.now() - originalRequest.metadata.startTime
      : 0;
    const correlationId = error.response?.headers?.['x-correlation-id'] ||
                          error.response?.data?.correlationId ||
                          originalRequest?.metadata?.correlationId;

    try {
      console.groupCollapsed(`[ADMIN API ERROR] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} → ${error.response?.status || 'NETWORK_ERROR'} (${durationMs}ms) [corr: ${correlationId}]`);
      console.error({
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        status: error.response?.status,
        durationMs,
        correlationId,
        params: originalRequest?.params,
        requestBody: sanitizePayload(originalRequest?.data),
        responseBody: sanitizePayload(error.response?.data),
        errorMessage: error.message,
        errorCode: error.response?.data?.code || 'UNKNOWN_ERROR'
      });
      console.groupEnd();
    } catch {
      // safe fallback
    }

    return Promise.reject(error);
  }
);

// Universities
export const getUniversities = async () => {

  const res = await api.get('/api/universities');
  return res.data;
};

export const getUniversity = async (id) => {
  const res = await api.get(`/api/universities/${id}`);
  return res.data;
};

export const createUniversity = async (data) => {
  const res = await api.post('/api/universities', data);
  return res.data;
};

export const updateUniversity = async (id, data) => {
  const res = await api.put(`/api/universities/${id}`, data);
  return res.data;
};

export const uploadAttachment = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/api/attachments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const uploaded = res.data?.data || res.data;
  return {
    name: uploaded.name || uploaded.fileName || file.name,
    fileName: uploaded.fileName || uploaded.name || file.name,
    url: uploaded.url || uploaded.publicUrl || uploaded.downloadUrl || '',
  };
};

// Form Schemas
export const getSchemas = async (universityId, universityCode) => {
  const res = await api.get('/api/admin/config/schemas', {
    params: { universityId, universityCode },
  });
  return res.data;
};

export const getSchemaDetails = async (schemaId) => {
  const res = await api.get(`/api/admin/config/schemas/${schemaId}`);
  return res.data;
};

export const createSchema = async (data) => {
  const res = await api.post('/api/admin/config/schemas', data);
  return res.data;
};

export const deleteSchema = async (schemaId) => {
  const res = await api.delete(`/api/admin/config/schemas/${schemaId}`);
  return res.data;
};

// Versions
export const createDraftVersion = async (schemaId, createdBy = 'admin') => {
  const res = await api.post(`/api/admin/config/schemas/${schemaId}/draft`, null, {
    params: { createdBy },
  });
  return res.data;
};

export const deleteVersion = async (versionId) => {
  const res = await api.delete(`/api/admin/config/versions/${versionId}`);
  return res.data;
};

export const getVersionTree = async (versionId) => {
  const res = await api.get(`/api/admin/config/versions/${versionId}`);
  return res.data;
};

export const publishVersion = async (versionId, publisher = 'admin') => {
  const res = await api.post(`/api/admin/config/versions/${versionId}/publish`, null, {
    params: { publisher },
  });
  return res.data;
};

export const rollbackVersion = async (schemaId, targetVersionId) => {
  const res = await api.post(`/api/admin/config/schemas/${schemaId}/rollback`, null, {
    params: { targetVersionId },
  });
  return res.data;
};

// Sections
export const createSection = async (data) => {
  const res = await api.post('/api/admin/config/sections', data);
  return res.data;
};

export const updateSection = async (id, data) => {
  const res = await api.put(`/api/admin/config/sections/${id}`, data);
  return res.data;
};

export const deleteSection = async (id) => {
  const res = await api.delete(`/api/admin/config/sections/${id}`);
  return res.data;
};

export const reorderSections = async (versionId, sectionIds) => {
  const res = await api.put(`/api/admin/config/versions/${versionId}/reorder-sections`, sectionIds);
  return res.data;
};

// Tables
export const createTable = async (data) => {
  const res = await api.post('/api/admin/config/tables', data);
  return res.data;
};

export const updateTable = async (id, data) => {
  const res = await api.put(`/api/admin/config/tables/${id}`, data);
  return res.data;
};

export const deleteTable = async (id) => {
  const res = await api.delete(`/api/admin/config/tables/${id}`);
  return res.data;
};

export const reorderTables = async (sectionId, tableIds) => {
  const res = await api.put(`/api/admin/config/sections/${sectionId}/reorder-tables`, tableIds);
  return res.data;
};

// Fields / Columns
export const createField = async (data) => {
  const res = await api.post('/api/admin/config/fields', data);
  return res.data;
};

export const updateField = async (id, data) => {
  const res = await api.put(`/api/admin/config/fields/${id}`, data);
  return res.data;
};

export const deleteField = async (id) => {
  const res = await api.delete(`/api/admin/config/fields/${id}`);
  return res.data;
};

export const reorderFields = async (tableId, fieldIds) => {
  const res = await api.put(`/api/admin/config/tables/${tableId}/reorder-fields`, fieldIds);
  return res.data;
};

// University Leadership (IQAC & VC user management)
export const getUniversityLeadership = async (universityId) => {
  const res = await api.get(`/api/users/university/${universityId}`);
  return res.data?.users || [];
};

export const createOrUpdateLeadership = async (universityId, data) => {
  const res = await api.post(`/api/users/university/${universityId}/leadership`, data);
  return res.data;
};

export const deleteUniversityLeadership = async (universityId, userId) => {
  const res = await api.delete(`/api/users/university/${universityId}/leadership/${userId}`);
  return res.data;
};

export default api;
