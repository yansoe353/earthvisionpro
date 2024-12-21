# Earth Vision Explorer

An interactive 3D Earth globe application that uses AI to provide information about different regions of the world. Built with React, Three.js, and the Groq Vision API.

## Features

- Interactive 3D Earth globe with realistic textures
- Click on any region to get AI-powered insights about that area
- Real-time rendering with Three.js
- Smooth controls for rotation, zoom, and pan
- Modern UI with a sleek information panel

## Prerequisites

- Node.js 16.x or higher
- A Groq API key

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Groq API key:
   ```
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```
4. Download the required Earth textures and place them in the `public` folder:
   - earth_texture.jpg (Earth map texture)
   - earth_bump.jpg (Bump map for terrain)
   - earth_clouds.png (Cloud layer texture)

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:5173`

## Usage

- Use your mouse to rotate the globe
- Scroll to zoom in/out
- Click on any region to get AI-generated information about that area
- The information panel on the right will display interesting facts about the selected region

## Technologies Used

- React + TypeScript
- Vite
- Three.js
- React Three Fiber
- Groq Vision API
- HTML-to-Image
