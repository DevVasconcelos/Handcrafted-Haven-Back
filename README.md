# Handcrafted Haven – Backend

Handcrafted Haven Backend is a RESTful API built as an independent service to manage users, products, categories, and reviews for the marketplace application.

The backend handles authentication, database persistence, and relational data management.

---

## 🌐 Live Frontend Application

The frontend is deployed on Vercel:

[Live Application](https://handcrafted-haven-front.vercel.app/)

---

## 🚀 Core Functionalities

- User registration
- User authentication
- Product CRUD operations
- Category management
- Product review system
- Relational database integration
- Structured API routes

---

## 🏗 Architecture

routes/
├── users
├── products
├── categories
├── reviews

controllers/
models/
middlewares/


The server handles HTTP requests and interacts with a relational database to persist data.

---

## 🗄 Database Structure

Relational tables:

- Users
- Products
- Categories
- Reviews

Seed/test data was implemented to validate API functionality.

---

## 🔁 End-to-End Data Flow

The backend enables complete data persistence:

1. User registration → database insertion  
2. Login validation → credential verification  
3. Product creation → relational storage  
4. Review submission → associated with product and user  

---

## 🛠 Technologies

- Node.js
- Express
- RESTful API architecture
- Relational database

---

## 📌 Purpose

This backend service demonstrates scalable API architecture, CRUD operations, authentication handling, and structured database modeling in a decoupled full-stack environment.

The backend follows a modular RESTful architecture:

