# JustClothing - E-commerce Platform

A comprehensive multi-vendor e-commerce platform built with Django REST Framework and React, specifically designed for clothing retailers in Bangladesh.

## 🚀 Features

### Core Features
- **Multi-vendor marketplace** with seller onboarding
- **Product management** with variants (size, color), custom sizing
- **Order management** with real-time tracking
- **User authentication** with JWT tokens
- **Shopping cart** and checkout system
- **Review and rating** system
- **Promotional codes** and featured products
- **Analytics dashboard** for sellers and admins
- **Real-time notifications** with Celery
- **API documentation** with Swagger/ReDoc

### Technical Features
- **RESTful API** with Django REST Framework
- **PostgreSQL** database with optimized queries
- **Redis** for caching and session management
- **Celery** for background tasks
- **Docker** containerization for easy deployment
- **Nginx** reverse proxy for production
- **Health checks** and monitoring
- **Comprehensive logging**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Django Backend │    │   PostgreSQL    │
│     (Port 3000)  │◄──►│    (Port 8000)  │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │      Redis      │    │     Celery      │
                       │   (Port 6379)   │◄──►│    Workers      │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Django 4.2.9** - Web framework
- **Django REST Framework** - API framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and message broker
- **Celery** - Background task processing
- **JWT** - Authentication
- **Swagger/ReDoc** - API documentation

### Frontend
- **React 18** - UI framework
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **Gunicorn** - WSGI server

## 📋 Prerequisites

- Docker and Docker Compose
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd JustClothing
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/swagger/
   - Django Admin: http://localhost:8000/admin/

## 🔧 Development Setup

### Backend Development

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp config.env .env
   # Edit .env with your local settings
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Development

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## 🐳 Docker Commands

### Development
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]
```

### Production
```bash
# Start with nginx proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Database Schema

### Core Models
- **User** - Custom user model with roles (customer, seller, admin)
- **Store** - Seller stores with business information
- **Product** - Products with variants and customization options
- **Order** - Order management with multi-vendor support
- **Review** - Product reviews and ratings
- **PromoCode** - Promotional codes and discounts

### Key Relationships
- Users can be customers or sellers
- Sellers own stores
- Stores have multiple products
- Products have variants (size/color combinations)
- Orders contain items from multiple stores
- Reviews are linked to verified purchases

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/refresh/` - Token refresh
- `POST /api/v1/auth/logout/` - User logout

### Products
- `GET /api/v1/products/products/` - List products
- `POST /api/v1/products/products/` - Create product
- `GET /api/v1/products/products/{id}/` - Product details
- `GET /api/v1/products/search/?q=query` - Search products

### Orders
- `GET /api/v1/orders/orders/` - List user orders
- `POST /api/v1/orders/orders/` - Create order
- `GET /api/v1/orders/cart/` - Get user cart
- `POST /api/v1/orders/cart/add/` - Add to cart

### Stores
- `GET /api/v1/stores/` - List stores
- `POST /api/v1/stores/` - Create store
- `POST /api/v1/stores/{id}/follow/` - Follow store

## 🔒 Environment Variables

### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=justclothing_db
DB_USER=justclothing_user
DB_PASSWORD=justclothing_password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📈 Performance Optimization

- **Database indexing** on frequently queried fields
- **Redis caching** for session management and frequent queries
- **Celery** for background tasks (email sending, report generation)
- **Nginx** for static file serving and load balancing
- **Database connection pooling**
- **Query optimization** with select_related and prefetch_related

## 🔐 Security Features

- **JWT authentication** with refresh tokens
- **CORS configuration** for frontend-backend communication
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **SQL injection protection** with Django ORM
- **XSS protection** with Django security middleware

## 📱 Mobile Responsiveness

The frontend is built with mobile-first design principles using TailwindCSS, ensuring optimal experience across all device sizes.

## 🚀 Deployment

### Production Deployment

1. **Set up production environment variables**
2. **Configure domain and SSL certificates**
3. **Use production Docker Compose configuration**
4. **Set up monitoring and logging**
5. **Configure backup strategies**

### Scaling Considerations

- **Load balancing** with multiple backend instances
- **Database read replicas** for improved performance
- **CDN integration** for static assets
- **Horizontal scaling** with Kubernetes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for the Bangladesh clothing industry** 