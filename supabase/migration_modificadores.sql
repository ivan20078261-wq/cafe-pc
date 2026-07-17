-- Tabla: grupos de modificadores
CREATE TABLE IF NOT EXISTS modificadores (
  id SERIAL PRIMARY KEY,
  comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('select', 'multi')),
  requerido BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0
);

-- Tabla: opciones dentro de cada grupo
CREATE TABLE IF NOT EXISTS opciones_modificador (
  id SERIAL PRIMARY KEY,
  modificador_id INTEGER REFERENCES modificadores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio_adicional DECIMAL(10,2) DEFAULT 0,
  orden INTEGER DEFAULT 0
);

-- Tabla: relación producto ↔ grupo de modificadores
CREATE TABLE IF NOT EXISTS producto_modificador (
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  modificador_id INTEGER REFERENCES modificadores(id) ON DELETE CASCADE,
  PRIMARY KEY (producto_id, modificador_id)
);
