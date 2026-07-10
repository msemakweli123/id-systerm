# 🎓 University ID System

A complete ID card management system for universities with role-based access control (Super Admin, Admin, Student).

## 📋 Table of Contents
- [Features](#-features)
- [Technologies Used](#-technologies-used)
- [System Requirements](#-system-requirements)
- [Installation Guide](#-installation-guide)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Roles & Permissions](#-roles--permissions)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Super Admin Dashboard
- 📊 **Dashboard**: View system overview with statistics
- 👥 **Manage Admins**: Create, edit, delete admin accounts
- 👤 **All Users**: View and manage all system users
- 🆔 **ID Cards**: View all generated ID cards
- 📈 **Reports**: Generate system reports and analytics
- 📋 **Activity Logs**: Track all system activities including logins/logouts
- ⚙️ **System Settings**: Configure system-wide settings

### Admin Dashboard
- 📝 **Add Students**: Register new students
- 👀 **View Students**: Search and manage student records
- 🖼️ **Approve Images**: Review and approve student photos
- 🏛️ **Departments**: Manage academic departments
- 📚 **Programs**: Manage academic programs
- 🏫 **Faculties**: Manage faculties
- 🆔 **Generate ID**: Create ID cards for students

### Student Dashboard
- 👤 **My Profile**: View and update profile information
- 🆔 **My ID Card**: View digital ID card
- 📷 **Upload Photo**: Upload passport photo for ID card

---

## 🛠️ Technologies Used

### Backend
- **Laravel** - PHP Framework
- **MySQL** - Database
- **Laravel Sanctum** - API Authentication
- **Intervention Image** - Image Processing

### Frontend
- **React** - UI Framework
- **Axios** - HTTP Client
- **Font Awesome** - Icons
- **CSS3** - Styling

---

## 📋 System Requirements

### Server Requirements
- PHP 8.1 or higher
- Composer
- MySQL 5.7 or higher
- Node.js 16.x or higher
- NPM or Yarn

### Recommended
- **OS**: Linux (Ubuntu 20.04+), Windows 10+, macOS
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space

---

## 💻 Installation Guide

### Step 1: Clone the Repository

# Navigate to backend
cd student-id-system

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Create database and update .env file with your database credentials
# Then run migrations
php artisan migrate

# Seed database with default data (optional)
php artisan db:seed

# Start Laravel server
php artisan serve

# Navigate to frontend
cd student-id-frontend

# Install Node dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build



```bash
git clone https://github.com/msemakweli123/id-systerm.git
cd id-systerm
