# UpNest – Growth Tracking for Neurodiverse & Lifelong Learners

---

## 🏁 Table of Contents

- [Project Overview](#-project-overview)
- [Motivation](#-motivation)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Lessons Learned / What Went Wrong](#-lessons-learned--what-went-wrong)
- [Next Steps / Improvements](#-next-steps--improvements)
- [Author](#-author)

---

## 🚀 Project Overview

**UpNest** is a web application designed to help parents—especially neurodivergent adults or late learners—track their baby's growth using WHO percentile standards. The goal is to make science-based growth tracking accessible, understandable, and safe for everyone, regardless of age or tech experience.

---

## 💡 Motivation

This project started as both a personal challenge and an inclusive technology initiative.

As a neurodivergent adult learning AWS Cloud, I wanted to demonstrate that:
- You can enter cloud/serverless development at any age.
- It’s possible to build and document complex stacks, even if you’re new to these tools.
- Documenting failures and lessons is as valuable as shipping features.

---

## 🧩 Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** AWS Lambda (Python 3.12), DynamoDB
- **API:** AWS API Gateway (HTTP API)
- **Infrastructure as Code:** AWS SAM, OpenAPI/Swagger
- **Authentication:** AWS Cognito (OIDC flow)
- **DevOps:** Docker, WSL2, VSCode Remote
- **Tooling:** Git, Prettier, ESLint, Pytest, isort, Black

---

## 📂 Project Structure

```plaintext
upnest/
├── backend/
│   ├── requirements.txt         # Dev requirements
│   ├── lambdas/
│   │   └── percentile/
│   │       ├── lambda_function.py
│   │       ├── requirements.txt
│   └── ...
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
└── .vscode/
    └── settings.json
```

---

## 🛠️ Getting Started

**Requirements:**
- Node.js 18+
- Python 3.12+
- AWS CLI
- SAM CLI
- Docker Desktop
- WSL2
- VSCode

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv venv-backend
source venv-backend/bin/activate
pip install -r requirements.txt
```

### SAM (example)

```bash
cd backend
sam build
sam deploy --guided
```

---

## ❌ Lessons Learned / What Went Wrong

Despite not shipping a full MVP before the hackathon deadline, here’s what I learned:

- **Trying to do too much, too fast:** New stack, new tools, and full AWS integration was ambitious.
- **Integration pain:** WSL, Docker, VSCode, AWS Lambda Python 3.12 and Numpy, plus modern frontend—all at once!
- **Version conflicts:** Many Python data-science libraries require careful pinning to work in AWS Lambda/Amazon Linux.
- **Setup, not code, is the real bottleneck:** Most blockers were infra, permissions, CORS, or environment—not business logic!
- **Value of “by example” learning:** Tiny working demos and microservices are better than over-ambitious full-stack sprints.
- **Good documentation saves your sanity.**

---

## 🙌 Next Steps / Improvements

- Build and test one feature at a time (“by example”, microservice-style).
- Separate dev/prod AWS environments early; keep requirements tight per Lambda.
- Prioritize deployable demos and visible progress.
- Continue documenting process, failures, and learning for other neurodivergent or late-blooming developers.

---

## 👤 Author

[Your Name or Handle]  
Hackathon participant | Neurodivergent learner | AWS Explorer

**Hackathon project – Work in Progress**