-- Script de inicialización de la base de datos VauCher
-- PostgreSQL 16
-- Este archivo es ejecutado automáticamente al crear el contenedor

-- Establecer timezone
SET timezone = 'America/Mexico_City';

-- Crear extensión para UUIDs (por si acaso)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
