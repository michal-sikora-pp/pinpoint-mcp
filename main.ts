import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { 
  getJobById, 
  getJobs, 
  createApplication,
  getApplications,
  getApplicationById
} from './api/index.js';
import { parsePdfFromUrl } from './utils/index.js';

dotenv.config();

const PINPOINT_API_KEY = process.env.PINPOINT_API_KEY;
const PINPOINT_SUBDOMAIN = process.env.PINPOINT_SUBDOMAIN;

if (!PINPOINT_API_KEY) {
  throw new Error('PINPOINT_API_KEY environment variable is required');
}

if (!PINPOINT_SUBDOMAIN) {
  throw new Error('PINPOINT_SUBDOMAIN environment variable is required');
}

const server = new McpServer({
  name: "pinpoint-mcp-server",
  version: "1.0.0",
});

server.tool(
  'get-jobs',
  'Tool to get jobs with filtering and pagination options',
  {
    search: z.string().optional()
      .describe('Search term to filter jobs by keyword'),
    status: z.enum(['open', 'closed', 'filled', 'on_hold', 'draft']).optional()
      .describe('Filter by job status'),
    employment_type: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']).optional()
      .describe('Filter by employment type'),
    workplace_type: z.enum(['onsite', 'remote', 'hybrid']).optional()
      .describe('Filter by workplace type'),
    page: z.number().positive().optional().default(1)
      .describe('Page number for pagination'),
    per_page: z.number().positive().optional().default(20)
      .describe('Number of results per page'),
  },
  async ({ search, status, employment_type, workplace_type, page, per_page }) => {
    const response = await getJobs({
      search,
      status,
      employment_type,
      workplace_type,
      page,
      per_page,
    });
    const jobs = response;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(jobs, null, 2),
        }
      ]
    }
  }
)

server.tool(
  'get-job',
  'Tool to get the job',
  {
    id: z.string().describe('The id of the job'),
  },
  async ({ id }) => {
    const response = await getJobById(id);
    const job = response;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(job, null, 2),
        }
      ]
    }
  }
)

server.tool(
  'create-application',
  'Create a job application with minimal information',
  {
    jobId: z.string().describe('The ID of the job to apply for'),
    firstName: z.string().describe('Applicant first name'),
    lastName: z.string().describe('Applicant last name'),
    email: z.string().email().describe('Applicant email address'),
  },
  async ({ jobId, firstName, lastName, email }) => {
    try {
      // First verify that the job exists
      const jobResponse = await getJobById(jobId);
      
      if (!jobResponse) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Job with ID ${jobId} not found.`,
            }
          ]
        };
      }

      // Create the application
      const applicationResponse = await createApplication({
        jobId,
        firstName,
        lastName,
        email
      });

      return {
        content: [
          {
            type: 'text',
            text: `Application submitted successfully! Application ID: ${applicationResponse.data.id}\n\nJob: ${jobResponse.data.attributes.title}\nApplicant: ${firstName} ${lastName}\nEmail: ${email}`,
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating application: ${error.message || 'Unknown error'}`,
          }
        ]
      };
    }
  }
);

server.tool(
  'get-applications',
  'Get job applications with optional filters',
  {
    jobId: z.string().optional().describe('Filter by job ID'),
    jobVisibility: z.string().optional().describe('Filter by job visibility (comma-separated: external,internal,private_job,confidential)'),
    stageId: z.string().optional().describe('Filter by application stage ID'),
    page: z.number().optional().describe('Page number for pagination'),
    perPage: z.number().optional().describe('Number of applications per page')
  },
  async ({ jobId, jobVisibility, stageId, page, perPage }) => {
    try {
      const response = await getApplications({
        job_id: jobId,
        job_visibility: jobVisibility,
        stage_id: stageId,
        page,
        per_page: perPage
      });

      return {
        content: [
          {
            type: 'text',
            text: `Found ${response.meta?.stats?.total?.count} applications:\n\n${JSON.stringify(response.data, null, 2)}`,
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching applications: ${error.message || 'Unknown error'}`,
          }
        ]
      };
    }
  }
);

server.tool(
  'get-application-by-id',
  'Get a specific job application by ID',
  {
    id: z.string().describe('The ID of the application to retrieve'),
  },
  async ({ id }) => {
    try {
      const response = await getApplicationById(id);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching application: ${error.message || 'Unknown error'}`,
          }
        ]
      };
    }
  }
);

// Add these prompts to your MCP server

server.registerPrompt(
  'recruitment-summary',
  { description: 'Generate a comprehensive recruitment summary for a specific job',
    argsSchema:{
      jobTitle: z.string().describe('The title of the job to analyze'),
    },
  },
  async ({ jobTitle }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze the recruitment status for job title ${jobTitle}. Use the available tools to:
1. Get detailed job information
2. Retrieve all applications for this job
3. Provide a summary including:
   - Job title and key details
   - Total number of applications
   - Application timeline and trends
   - Current pipeline status
   - Key insights and recommendations

Format the response as a professional recruitment report.`
          }
        }
      ]
    };
  }
);

server.registerPrompt(
  'application-screening',
  { description: 'Screen and evaluate applications for a job position',
    argsSchema:{
      jobTitle: z.string().describe('The title of the job to screen applications for'),
      criteria: z.string().optional().describe('Specific screening criteria or requirements'),
    },
  },
  async ({ jobTitle, criteria }) => {
    const screeningCriteria = criteria || 'relevant experience, qualifications, and cultural fit';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please screen and evaluate all applications for job title ${jobTitle}. 

Screening criteria: ${screeningCriteria}

Tasks:
1. Get the job details to understand requirements
2. Retrieve all applications for this position
3. For each application, load the CV from the URL and evaluate based on:
   - How well they match the job requirements
   - Application completeness and quality
   - Timeline of application (early vs late applicants)
4. Rank applications and provide recommendations for next steps
5. Identify any red flags or standout candidates

Provide a structured evaluation report with clear recommendations.`
          }
        }
      ]
    };
  }
);

server.registerPrompt(
  'job-performance-analysis',
  { description: 'Analyze job posting performance and application metrics',
    argsSchema:{
      timeframe: z.enum(['week', 'month', 'quarter', 'all']).optional().describe('Analysis timeframe'),
      jobType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']).optional().describe('Filter by employment type'),
    },
  },
  async ({ timeframe = 'month', jobType }) => {
    const timeframeText = timeframe === 'all' ? 'all available data' : `the past ${timeframe}`;
    const jobTypeFilter = jobType ? ` for ${jobType} positions` : '';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Analyze job posting performance${jobTypeFilter} over ${timeframeText}. 

Please:
1. Get all jobs (filter by employment type if specified)
2. For each job, get application data
3. Calculate metrics including:
   - Applications per job
   - Time-to-first-application
   - Application conversion rates
   - Most/least popular positions
   - Seasonal trends if applicable
4. Crate a table showing top performing channels (channel_source in the application data) and order by number of applications. Only provide this analysis if there are at least 5 applications per channel.
4. Identify top-performing job postings and success factors
5. Provide recommendations for improving underperforming positions

For the layout keep it professional and easy to read. The colour chemer should not use gradients and be grayscale where possible.

Create a comprehensive performance dashboard with visualizations where helpful.`
          }
        }
      ]
    };
  }
);

server.registerPrompt(
  'candidate-pipeline-report',
  { description: 'Generate a pipeline report showing candidate progression',
    argsSchema:{
      jobId: z.string().optional().describe('Specific job ID to analyze (if not provided, analyzes all jobs)'),
      stageId: z.string().optional().describe('Focus on specific stage in the pipeline'),
    },
  },
  async ({ jobId, stageId }) => {
    const jobScope = jobId ? `for job ID ${jobId}` : 'across all active positions';
    const stageScope = stageId ? ` with focus on stage ${stageId}` : '';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate a candidate pipeline report ${jobScope}${stageScope}.

Please:
1. ${jobId ? `Get details for job ${jobId}` : 'Get all open jobs'}
2. Retrieve applications and analyze pipeline stages
3. Create a pipeline visualization showing:
   - Number of candidates at each stage
   - Conversion rates between stages
   - Average time spent in each stage
   - Bottlenecks or drop-off points
4. Identify candidates who may need attention (stuck in stages, high-potential candidates)
5. Provide actionable recommendations for pipeline optimization

Format as an executive summary with clear metrics and visual representations.`
          }
        }
      ]
    };
  }
);

server.registerPrompt(
  'quick-application-submit',
  { description: 'Streamlined prompt for submitting job applications',
    argsSchema:{
      jobTitle: z.string().describe('Title or keyword to search for jobs'),
      candidateName: z.string().describe('Full name of the candidate'),
      candidateEmail: z.string().email().describe('Email address of the candidate'),
    },
  },
  async ({ jobTitle, candidateName, candidateEmail }) => {
    const [firstName, ...lastNameParts] = candidateName.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help submit an application for ${candidateName} (${candidateEmail}).

Steps:
1. Search for jobs with title containing "${jobTitle}"
2. If multiple matches, show the options and let me choose
3. If single match, proceed to submit application with:
   - First name: ${firstName}
   - Last name: ${lastName}
   - Email: ${candidateEmail}
4. Confirm successful submission and provide application details

Make this process as smooth as possible and handle any errors gracefully.`
          }
        }
      ]
    };
  }
);

server.registerPrompt(
  'recruitment-insights',
  { description: 'Generate strategic recruitment insights and recommendations',
    argsSchema:{
      focus: z.enum(['diversity', 'efficiency', 'quality', 'cost', 'timeline']).optional().describe('Primary focus area for insights'),
    },
  },
  async ({ focus = 'efficiency' }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate strategic recruitment insights with a focus on ${focus}.

Please analyze:
1. All current job postings and their performance
2. Application patterns and trends
3. Pipeline efficiency and bottlenecks
4. ${focus === 'diversity' ? 'Diversity metrics and inclusive hiring practices' : ''}
${focus === 'efficiency' ? 'Time-to-hire metrics and process optimization opportunities' : ''}
${focus === 'quality' ? 'Application quality indicators and candidate assessment metrics' : ''}
${focus === 'cost' ? 'Cost-per-hire analysis and budget optimization suggestions' : ''}
${focus === 'timeline' ? 'Hiring timeline analysis and acceleration strategies' : ''}

Provide:
- Key performance indicators
- Benchmarking against industry standards
- Specific recommendations for improvement
- Risk assessment and mitigation strategies
- Implementation roadmap

Format as an executive briefing with actionable insights.`
          }
        }
      ]
    };
  }
);
server.tool(
  'parse-cv-from-url',
  'Parse a CV from a PDF URL and return the raw text content',
  {
    url: z.string().url().describe('URL of the PDF CV to parse'),
  },
  async ({ url }) => {
    try {
      // Parse the PDF from the URL
      const pdfData = await parsePdfFromUrl(url);
      
      // Return the raw text content directly
      return {
        content: [
          {
            type: 'text',
            text: pdfData
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error parsing CV from URL: ${error.message || 'Unknown error'}`
          }
        ]
      };
    }
  }
);

const transport = new StdioServerTransport();

server.connect(transport);
