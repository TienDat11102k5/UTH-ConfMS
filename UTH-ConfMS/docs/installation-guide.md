# Installation Guide

## 1. System Requirements
### 1.1 Hardware Requirements
### 1.2 Software Requirements

## 2. Installation Steps
### 2.1 Database Setup
```sql
CREATE DATABASE confms_db;
```

### 2.2 Backend Installation
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 2.3 Frontend Installation
```bash
cd frontend
npm install
npm run dev
```

### 2.4 AI Service Installation
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

## 3. Docker Installation
```bash
cd docker
docker-compose up -d
```

## 4. Configuration
### 4.1 Backend Configuration
### 4.2 Frontend Configuration
### 4.3 AI Service Configuration

## 5. Verification
