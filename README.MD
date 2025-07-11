# Pinpoint MCP Server

A Model Context Protocol (MCP) server that provides access to Pinpoint job board data for AI assistants like Claude.

## Overview

This server implements the Model Context Protocol (MCP) to allow AI assistants to interact with the Pinpoint job board API. It provides tools for searching jobs and resources for accessing job data.

## Features

- 🔍 Search for jobs with filtering options
- 📋 Access job details and information
- 🔄 Real-time data from Pinpoint API
- 🤖 Compatible with MCP-enabled AI assistants

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file with your Pinpoint API credentials:

```
PINPOINT_API_KEY=your_api_key_here
PINPOINT_SUBDOMAIN=your_subdomain_here
```

### 3. Run the Server

```bash
npx tsx main.ts
```

For testing with MCP Inspector:

```bash
npx -y @modelcontextprotocol/inspector npx -y tsx main.ts
```

## Claude Code Configuration

To use this MCP server with Claude Code, add the following configuration to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "pinpoint": {
      "install": "npm install",
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/michalsikora/learning/pinpoint-mcp/main.ts"
      ],
      "env": {
        "PINPOINT_API_KEY": "your_api_key_here",
        "PINPOINT_SUBDOMAIN": "your_subdomain_here"
      }
    }
  }
}
```

Replace `your_api_key_here` and `your_subdomain_here` with your actual Pinpoint API credentials.

## API Integration

The server connects to the Pinpoint API using the wrapper in the `/api` directory. It provides:

- Job search functionality with filtering
- Detailed job information retrieval
- Error handling and request management

## MCP Tools and Resources

### Tools

- `search-jobs`: Search for jobs with various filters
- `get-time`: Get the current timestamp
- `echo`: Simple text echo tool

### Resources

- `jobs://recent`: Access recent job listings
- `jobs://job/{id}`: Access specific job details by ID

## Dependencies

- `@modelcontextprotocol/sdk`: MCP server framework
- TypeScript and development tools
- Axios for API requests

## Project Structure

- `main.ts`: Main server implementation
- `/api`: Pinpoint API integration
  - `pinpoint.ts`: API wrapper with TypeScript interfaces
  - `index.ts`: Clean export interface
- `/utils`: Utility functions
