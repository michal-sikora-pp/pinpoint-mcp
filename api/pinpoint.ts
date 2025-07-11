import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Pinpoint API configuration
const PINPOINT_API_KEY = process.env.PINPOINT_API_KEY;
const PINPOINT_SUBDOMAIN = process.env.PINPOINT_SUBDOMAIN;
export const BASE_URL = `https://${PINPOINT_SUBDOMAIN}.pinpointhq.com/api/v1`;

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-KEY': PINPOINT_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});


/**
 * Get all jobs with optional filters
 * @param filters - Optional filters for jobs
 * @returns Promise with jobs response
 */
export const getJobs = async (filters: { 
  search?: string; 
  status?: string; 
  employment_type?: string; 
  workplace_type?: string;
  page?: number;
  per_page?: number;
} = {}) => {
  try {
    // Build query parameters
    const params: Record<string, string> = {};
    
    // Add filter parameters
    if (filters.search) {
      params['filter[search]'] = filters.search;
    }
    if (filters.status) {
      params['filter[status]'] = filters.status;
    }
    if (filters.employment_type) {
      params['filter[employment_type]'] = filters.employment_type;
    }
    if (filters.workplace_type) {
      params['filter[workplace_type]'] = filters.workplace_type;
    }
    if (filters.page) {
      params['page[number]'] = filters.page.toString();
    }
    if (filters.per_page) {
      params['page[size]'] = filters.per_page.toString();
    }
    
    const response = await api.get('/jobs', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error.response?.data || error.message);
    throw error;
  }
};

export const getJobById = async (id: string) => {
  try {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Interface for minimal job application data
 */
export interface MinimalApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  jobId: string;
}

/**
 * Creates a job application with minimal required fields
 * @param application - The application data with minimal required fields
 * @returns The created application data
 */
export const createApplication = async (application: MinimalApplicationData) => {
  try {
    // Format the application data according to JSON:API spec
    const applicationData = {
      data: {
        type: "applications",
        attributes: {
          first_name: application.firstName,
          last_name: application.lastName,
          email: application.email
        },
        relationships: {
          job: {
            data: {
              type: "jobs",
              id: application.jobId
            }
          }
        }
      }
    };

    const response = await api.post('/applications', applicationData);
    return response.data;
  } catch (error) {
    console.error('Error creating application:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Interface for application filters
 */
export interface ApplicationFilters {
  job_id?: string;
  job_visibility?: string; // 'external,internal,private_job,confidential'
  stage_id?: string;
  page?: number;
  per_page?: number;
}

/**
 * Get all applications with optional filters
 * @param filters - Optional filters for applications
 * @returns Promise with applications response
 */
export const getApplications = async (filters: ApplicationFilters = {}) => {
  try {
    // Build query parameters
    const params: Record<string, string> = {};
    
    // Add filter parameters
    if (filters.job_id) {
      params["filter[job_id]"] = filters.job_id;
    }
    if (filters.job_visibility) {
      params["filter[job_visibility]"] = filters.job_visibility;
    }
    if (filters.stage_id) {
      params["filter[stage_id]"] = filters.stage_id;
    }
    if (filters.page) {
      params.page = filters.page.toString();
    }
    if (filters.per_page) {
      params.per_page = filters.per_page.toString();
    }
    params['extra_fields[applications]'] = 'attachments'
    params['stats[total]'] = 'count'
    
    const response = await api.get('/applications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching applications:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get a specific application by ID
 * @param id - The ID of the application to fetch
 * @returns Promise with application data
 */
export const getApplicationById = async (id: string) => {
  try {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error.response?.data || error.message);
    throw error;
  }
};
