# E-commerce Microservices Platform

A containerized e-commerce application built using a microservices architecture. The platform consists of an API Gateway, Product Service, and Order Service, with PostgreSQL used for persistent data storage and Redis used for caching.

## Architecture

The application consists of three Node.js microservices:

- **API Gateway** – external entry point for client requests.
- **Product Service** – manages product data using PostgreSQL and Redis.
- **Order Service** – manages customer orders using PostgreSQL.
- **PostgreSQL** – persistent relational database.
- **Redis** – caching layer for product data.
