# Project 1

## Overview

This project marks the beginning of my BackEnd Development journey. The goal was to construct a basic backend that provides `jokes.json` to the client. This is the first node.js code I've written, implementing the server using Express and adding file handling using the Path module. On the frontend, I've resolved the CORS error by using a proxy server since the server was running on port 4000 and the client on port 5173 (Vite port). The frontend is designed to be simple and sleek.

## Table of Contents

-   [Technologies Used](#technologies-used)
-   [Features](#features)
-   [Setup and Installation](#setup-and-installation)
-   [Usage](#usage)

## Technologies Used

-   **Node.js**: JavaScript runtime environment.
-   **Express**: Fast, unopinionated, minimalist web framework for Node.js.
-   **Vite**: Next Generation Frontend Tooling.
-   **Path**: Node.js module to handle file paths.
-   **Proxy Server**: For resolving CORS issues.

## Features

-   Basic backend server using Node.js and Express.
-   Serves `jokes.json` file to the client.
-   Simple and sleek frontend to display jokes.
-   Proxy server setup to handle CORS issues between different ports.

## Setup and Installation

### Prerequisites

-   Node.js installed on your machine.
-   Vite installed globally for the frontend (optional, can use npm scripts).

### Backend Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/SatyamVyas04/LearningBackEnd.git
    cd LearningBackEnd/Project1/Server
    ```

2. Install backend dependencies:

    ```bash
    npm install
    ```

3. Start the backend server:

    ```bash
    npm start
    ```

    This will start the server on `http://localhost:4000`.

### Frontend Setup

1. Navigate to the frontend directory:

    ```bash
    cd LearningBackEnd/Project1/Client
    ```

2. Install frontend dependencies:

    ```bash
    npm install
    ```

3. Start the frontend development server:

    ```bash
    npm run dev
    ```

    This will start the Vite development server on `http://localhost:5173`.

## Usage

-   Ensure both backend and frontend servers are running.
-   Open your browser and navigate to `http://localhost:5173`.
-   The frontend will fetch jokes from the backend and display them.
