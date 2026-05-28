# DeepInsight AI 🧠
DeepInsight is an intelligent research platform for students, developers, and knowledge workers who need to understand and synthesize information fast.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

DeepInsight is an intelligent research platform for students, developers, and knowledge workers who need to understand and synthesize information fast. Users can upload a research paper, paste a GitHub link, or share any text — and get back structured insights, visual mind maps, concept breakdowns, and comprehensive notes. Currently supported input formats include plain text, GitHub repository links, and text-based research papers.

## ✨ Features
- **Automated Research Summarization:** Instantly generate concise summaries from long research papers or articles.
- **Visual Mind Maps:** Interactive visualization of complex topics powered by D3.js.
- **GitHub Repository Analysis:** Deep dive into repo structure, purpose, and language breakdown.
- **Interactive Chat/Q&A:** Ask questions directly about the uploaded content using Gemini AI.
- **Secure OAuth2 Authentication:** Seamless and secure user login system.
- **Responsive, Animated UI:** Modern interfaces built with Framer Motion and Tailwind CSS.

## 📸 Screenshots
<!-- TODO: Add GIF or screenshots of the application in action here -->

## 💻 Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Data Visualization:** D3.js
- **Icons:** Lucide React

### Backend
- **Framework:** Spring Boot (Java 17)
- **Database:** MySQL
- **Data Access:** Spring Data JPA
- **Security:** Spring Security, OAuth2
- **AI Integration:** Google Gemini API via WebFlux WebClient

## 🛠️ Prerequisites
- **Node.js** (v18+)
- **Java** (JDK 17+)
- **Maven**
- **MySQL Server**
- **Google Gemini API Key**

## 🔐 Environment Variables

### Backend (`application.properties`)
You will need to configure the following in your `application.properties` (or as environment variables):
- Database URL
- Database username
- Database password
- Gemini API key
- OAuth2 client ID & secret

### Frontend (`.env`)
Create a `.env` file in the `frontend` directory:
- `VITE_API_BASE_URL`

> ⚠️ **Warning:** Never commit your actual API keys or secrets (like the Gemini API key or OAuth secrets) to version control. Always use a `.env` file and ensure it is included in your `.gitignore`.

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/princyjain-06/deepInsight-ai.git
cd deepInsight-ai
```

### 2. Backend Setup
```bash
cd backend
# Configure your application.properties and environment variables before running
mvn clean install
mvn spring-boot:run
```
The backend will start at `http://localhost:8080`.

### 3. Frontend Setup
```bash
cd frontend
# Configure your .env file
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.

## 📂 Project Structure
```text
deepInsight-ai/
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── utils/
│       └── main.jsx
└── backend/
    └── src/
        └── main/
            └── java/
                └── com/
                    └── deepinsight/
                        ├── config/
                        ├── controller/
                        ├── model/
                        ├── repository/
                        └── service/
```

## 🤝 Contributing
Contributions are welcome! Please follow these steps:
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

> 💡 **Tip:** It's always a good idea to open an issue first to discuss the proposed changes before starting to work on them!

## 🔮 Future Scope
- PDF and DOCX format support
- Collaborative research workspaces
- Integration with Notion and Obsidian

## 👨‍💻 Contributors
- **Princy** — [https://github.com/princyjain-06](https://github.com/princyjain-06)

## 📄 License
Distributed under the MIT License.

