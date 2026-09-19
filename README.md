# ✈️ Travel Ease

**Plan trips around your budget, available time, and local experiences.**

Travel Ease is a smart tourism and travel-planning project built to help travelers explore destinations with less scattered research. It brings trip planning and locally relevant discovery into one web experience.

## 🌍 Why Travel Ease?

Planning a trip can mean searching across websites, blogs, and videos to compare destinations, schedules, budgets, and local places. Travel Ease is designed to make that process more organized and help travelers discover experiences beyond the usual tourist checklist.

## ✨ Project Features

- **Budget- and time-aware trip planning:** plan a trip based on the budget and time available.
- **Hidden gems:** discover local places and experiences beyond common tourist spots.
- **AI travel guide:** get travel-oriented assistance powered by Google Gemini.
- **Crowd insights:** show low, moderate, or high crowd information; crowd reports are intended to remain relevant for a limited period (about two hours).
- **Local guide flow:** local guides can register, with an admin approval process.
- **Weather information:** use weather data to support trip planning.

## 🧰 Tech Stack

- **Frontend:** React, Vite
- **Authentication:** Firebase Authentication
- **Database:** Cloud Firestore
- **AI:** Google Gemini API (`@google/genai`)
- **Weather:** Open-Meteo
- **Image uploads:** Cloudinary
- **Server-side component:** Express (where configured in the project)

## 🏗️ High-Level Architecture

1. The React application provides the traveler-facing interface.
2. Firebase Authentication supports user sign-in.
3. Cloud Firestore stores application data such as user and destination-related information.
4. Gemini provides AI-assisted travel guidance.
5. Open-Meteo supplies weather information, while Cloudinary handles image uploads.
6. Local-guide registration and approval support the guide workflow.

## 🚀 Getting Started

Setup commands and environment-variable names should match the current repository configuration. Before running locally:

1. Install a compatible Node.js LTS version.
2. Clone this repository and install dependencies using the package manager and lockfile included in the project.
3. Configure the required Firebase, Gemini, weather, and Cloudinary settings using local environment variables.
4. Start the development scripts defined in `package.json`.

**Security:** Do not commit API keys, Firebase service-account credentials, or other secrets. Use environment variables and appropriate Firebase security rules.

## 🖼️ Screenshots / Demo

<img width="1342" height="679" alt="image" src="https://github.com/user-attachments/assets/3202f0f3-d628-43eb-b838-e07fcca905cd" />

<img width="1360" height="682" alt="image" src="https://github.com/user-attachments/assets/af769bdd-a000-4677-b508-605e12959d95" />

<img width="1352" height="683" alt="image" src="https://github.com/user-attachments/assets/497513f8-f418-4e34-80e3-83ac393c4899" />

## 🧭 Project Status

A student hackathon project. Refer to the current source code for the implemented state of each feature; planned or partially completed functionality should not be treated as production-ready. 

**Live-Demo**
https://travel-ease2026.netlify.app/

## 👥 Team

Our 6 member team Worked on it :- Me(Ankit Bidhan), Dhruv Verma, Anupreet Dhiman, Natasha, Deendyal Mandar, Saksham Gautam

## 👨‍💻 Maintainer

**Ankit Bidhan**  
B.Tech Computer Engineering Student  
State Institute of Engineering & Technology, Nilokheri
