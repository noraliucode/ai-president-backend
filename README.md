# AI President API

## Overview

The "AI President API" is a Node.js application developed with the Express framework. It serves as a backend server facilitating various functionalities related to artificial intelligence and data streaming. The application integrates with external APIs and manages streaming data, particularly focusing on interactions and analyses relevant to presidential data.

## Features

- **Express Middleware**: Incorporates `express.json()` and `cors` for handling JSON requests and enabling Cross-Origin Resource Sharing.
- **API Integrations**:
  - D-ID API for managing streaming data.
  - YouTube API for live chat message fetching and processing.
- **Environment Variable Management**: Utilizes environment variables to securely store API keys, database connections, and other sensitive information.
- **Robust Error Handling**: Implements comprehensive error handling for database connectivity and API requests.

## Installation

1. Clone the repository to your local machine.
2. Run `npm install` to install the required dependencies.
3. Configure the environment variables (`PORT`, `DID_API_URL`, `DID_API_KEY`, `VIDEO_ID`, `API_KEY`).

## Running the Application

Use `npm start` to launch the server. It will listen on the port specified in the environment variables (default is 3000).

## API Endpoints

- `POST /talks-stream`: Manages streaming data from specified image URLs.
- `POST /ice`: Handles ICE candidate information for data streaming.
- `POST /sdp`: Manages Session Description Protocol (SDP) information.
- `DELETE /stream/:streamId`: Allows for deletion of streams via stream ID.
- `POST /streams`: Facilitates the creation of new streams with specific parameters.
- `GET /chat`: Retrieves and processes live chat messages from YouTube.

## Contributing

We welcome contributions. Please adhere to the standard Git workflow for contributing. Submit pull requests for any proposed features or bug fixes.

## License

[Specify the license here, e.g., MIT, GPL-3.0, etc.]

