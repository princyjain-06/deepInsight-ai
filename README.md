# DeepInsight AI 🧠

DeepInsight is an intelligent research platform designed for students, developers, and knowledge workers who need to understand and synthesize information *fast*. Upload a research paper, paste a GitHub link, or share any text — and get back structured insights, visual mind maps, concept breakdowns, and comprehensive notes all in one place.

## 🚀 Features

- **Automated Research Summarization:** Instantly generate concise summaries from long research papers or articles.
- **Visual Mind Maps:** Automatically generate dynamic, interactive mind maps (powered by D3.js) to visualize complex topics.
- **GitHub Repository Analysis:** Paste a repo link to quickly understand its structure and purpose.
- **Interactive Chat/Q&A:** Ask questions about the uploaded content using the integrated Gemini AI.
- **Secure Authentication:** Seamless and secure OAuth2 login system.
- **Beautiful, Responsive UI:** Modern, animated user interface built with Framer Motion and Tailwind CSS.

## 💻 Tech Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Data Visualization:** D3.js
- **Icons:** Lucide React

### Backend
- **Framework:** Spring Boot (Java 17)
- **Database:** MySQL with Spring Data JPA
- **Security:** Spring Security & OAuth2
- **AI Integration:** Google Gemini API (via WebFlux WebClient)

## 🛠️ Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js** (v18+)
- **Java** (JDK 17+)
- **Maven**
- **MySQL Server**
- **Google Gemini API Key**

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/princyjain-06/deepInsight-ai.git
cd deepInsight-ai
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your `application.properties`:
   - Set up your MySQL database credentials.
   - Add your Google Gemini API Key.
   - Configure OAuth2 credentials if required.
3. Build and run the Spring Boot application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
   The backend will start on `http://localhost:8080` (or as configured).

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## 🔮 Future Scope

- Support for more document formats (PDF, DOCX).
- Collaborative research workspaces for teams.
- Integration with external knowledge bases (e.g., Notion, Obsidian).

## 👨‍💻 Contributors

- **Princy** - *Initial work* - [GitHub Profile](https://github.com/princyjain-06)
