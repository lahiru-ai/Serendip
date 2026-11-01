# Serendip Multi-Vendor Marketplace

A full-stack multi-vendor e-commerce marketplace platform built with **Spring Boot 3 (Java 21)** and **React (Vite + TypeScript + Tailwind CSS)**.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Java 21, Spring Boot 3.3.5, Spring Security, Spring Data JPA, Hibernate, PostgreSQL (Supabase / local), Flyway
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM
- **Database**: PostgreSQL (configured by default with Supabase pooler, or custom via environment variables)

---

## 📋 Prerequisites

Before running the project, make sure the following are installed:

1. **Java JDK 21+** ([Download OpenJDK / Oracle JDK](https://adoptium.net/))
   - Verify: `java -version`
2. **Apache Maven 3.9+** ([Download Maven](https://maven.apache.org/download.cgi))
   - Verify: `mvn -version`
3. **Node.js (v18+) & npm** ([Download Node.js](https://nodejs.org/))
   - Verify: `node -v` and `npm -v`
4. **Git** ([Download Git](https://git-scm.com/))

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/Serendip.git
cd Serendip
```

---

### 2. Run the Backend (Spring Boot)

Open a terminal in the root directory:

```bash
mvn clean spring-boot:run
```

*The backend server will start on port `8080`: `http://localhost:8080`.*

> **Database Configuration**:
> By default, the application connects to a cloud PostgreSQL database configured in `src/main/resources/application.properties`.
> You can override database credentials via environment variables if needed:
> ```bash
> export SPRING_DATASOURCE_URL="jdbc:postgresql://<host>:<port>/<dbname>"
> export SPRING_DATASOURCE_USERNAME="<username>"
> export SPRING_DATASOURCE_PASSWORD="<password>"
> ```

---

### 3. Run the Frontend (React + Vite)

Open a **new terminal** window and navigate to the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

*The frontend application will start on: `http://localhost:5173`.*

> All API calls to `/api/*` are automatically reverse-proxied by Vite to the backend on `http://localhost:8080`.

---

## 👥 Pre-seeded Demo Accounts

When the application boots for the first time, `DataInitializer` seeds test accounts and catalog items:

| Role | Email | Password | Access / Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@serendip.com` | `AdminPass123!` | System dashboard, merchant approvals, platform governance |
| **Seller** | `seller@serendip.com` | `SellerPass123!` | Merchant store dashboard, inventory, vendor orders |
| **Buyer** | `buyer@serendip.com` | `BuyerPass123!` | Catalog browsing, shopping cart, checkout, order tracking |

---

## 📂 Project Structure

```text
Serendip/
├── src/main/java/com/serendip/marketplace/
│   ├── config/          # Security, Web, CORS, DataInitializer
│   ├── controller/      # REST API Controllers (Auth, Product, Order, etc.)
│   ├── entity/          # JPA Entities (User, Buyer, Seller, Product, Order, etc.)
│   ├── repository/      # Spring Data Repositories
│   └── service/         # Business Logic Layer
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/    # Flyway SQL migrations
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth, Cart, Currency contexts
│   │   ├── pages/       # Admin, Seller, Buyer views & Checkout
│   │   └── services/    # Axios / Fetch API client
│   ├── package.json
│   └── vite.config.ts
├── pom.xml              # Maven dependencies and build definition
└── README.md            # Setup and running instructions
```
