-- Database schema for Show Planner

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    roles TEXT[] DEFAULT '{}',
    talents TEXT[] DEFAULT '{}',  -- Deprecated: Use bruker_talent table instead
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Talentkategori tabell (hierarkisk, maks 2 nivåer)
CREATE TABLE IF NOT EXISTS talentkategori (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES talentkategori(id) ON DELETE CASCADE,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(navn, parent_id) -- Unik kombinasjon av navn og parent
);

-- Talent tabell
CREATE TABLE IF NOT EXISTS talent (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) NOT NULL,
    kategori_id INTEGER NOT NULL REFERENCES talentkategori(id) ON DELETE RESTRICT,
    leder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bruker-talent koblingstabell (mange-til-mange)
CREATE TABLE IF NOT EXISTS bruker_talent (
    id SERIAL PRIMARY KEY,
    bruker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    talent_id INTEGER NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
    erfaringsnivaa VARCHAR(50) DEFAULT 'grunnleggende',
    sertifisert BOOLEAN DEFAULT false,
    notater TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bruker_id, talent_id)
);

-- Produksjonskategori tabell
CREATE TABLE IF NOT EXISTS produksjonskategori (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(100) UNIQUE NOT NULL,
    beskrivelse TEXT,
    plassering VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Talent-mal for produksjonskategorier
CREATE TABLE IF NOT EXISTS produksjonskategori_talent_mal (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER NOT NULL REFERENCES produksjonskategori(id) ON DELETE CASCADE,
    talent_id INTEGER NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
    antall INTEGER NOT NULL DEFAULT 1 CHECK (antall > 0),
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kategori_id, talent_id)
);

-- Plan-mal for produksjonskategorier (overskrifter og hendelser)
CREATE TABLE IF NOT EXISTS produksjonskategori_plan_mal_element (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER NOT NULL REFERENCES produksjonskategori(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('overskrift', 'hendelse')),
    navn VARCHAR(200) NOT NULL,
    varighet_minutter INTEGER CHECK (varighet_minutter IS NULL OR varighet_minutter >= 0),
    parent_id INTEGER REFERENCES produksjonskategori_plan_mal_element(id) ON DELETE CASCADE,
    rekkefølge INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_overskrift_struktur CHECK (
        (type = 'overskrift' AND parent_id IS NULL AND varighet_minutter IS NULL)
        OR
        (type = 'hendelse' AND parent_id IS NOT NULL AND varighet_minutter IS NOT NULL)
    )
);

-- Oppmøtetider-mal for produksjonskategorier
CREATE TABLE IF NOT EXISTS produksjonskategori_oppmote_mal (
    id SERIAL PRIMARY KEY,
    kategori_id INTEGER NOT NULL REFERENCES produksjonskategori(id) ON DELETE CASCADE,
    navn VARCHAR(200) NOT NULL,
    beskrivelse TEXT,
    minutter_før_start INTEGER NOT NULL DEFAULT 0,
    rekkefølge INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_minutter_før_start CHECK (minutter_før_start >= 0)
);

-- Produksjonsplan tabell
CREATE TABLE IF NOT EXISTS produksjonsplan (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(200) NOT NULL,
    beskrivelse TEXT,
    start_dato DATE,
    slutt_dato DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produksjon tabell
CREATE TABLE IF NOT EXISTS produksjon (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(200) NOT NULL,
    tid TIMESTAMP NOT NULL,
    publisert BOOLEAN DEFAULT false,
    beskrivelse TEXT,
    plan_id INTEGER REFERENCES produksjonsplan(id) ON DELETE SET NULL,
    plassering VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produksjon plan-elementer (kopieres fra kategori plan-mal)
CREATE TABLE IF NOT EXISTS produksjon_plan_element (
    id SERIAL PRIMARY KEY,
    produksjon_id INTEGER NOT NULL REFERENCES produksjon(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('overskrift', 'hendelse')),
    navn VARCHAR(200) NOT NULL,
    varighet_minutter INTEGER CHECK (varighet_minutter IS NULL OR varighet_minutter >= 0),
    parent_id INTEGER REFERENCES produksjon_plan_element(id) ON DELETE CASCADE,
    rekkefølge INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_produksjon_overskrift_struktur CHECK (
        (type = 'overskrift' AND parent_id IS NULL AND varighet_minutter IS NULL)
        OR
        (type = 'hendelse' AND parent_id IS NOT NULL AND varighet_minutter IS NOT NULL)
    )
);

-- Produksjon oppmøtetider (kopieres fra kategori oppmøte-mal)
CREATE TABLE IF NOT EXISTS produksjon_oppmote (
    id SERIAL PRIMARY KEY,
    produksjon_id INTEGER NOT NULL REFERENCES produksjon(id) ON DELETE CASCADE,
    navn VARCHAR(200) NOT NULL,
    beskrivelse TEXT,
    tidspunkt TIMESTAMP NOT NULL,
    rekkefølge INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produksjon talent-behov (kopieres fra kategori talent-mal)
CREATE TABLE IF NOT EXISTS produksjon_talent_behov (
    id SERIAL PRIMARY KEY,
    produksjon_id INTEGER NOT NULL REFERENCES produksjon(id) ON DELETE CASCADE,
    talent_navn VARCHAR(100) NOT NULL,
    talent_kategori_sti TEXT NOT NULL,
    antall INTEGER NOT NULL DEFAULT 1,
    beskrivelse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (produksjon_id, talent_navn),
    CONSTRAINT check_antall_positiv CHECK (antall > 0)
);

-- Junction/kobling-tabell for mange-til-mange relasjon
-- En produksjon har mange personer med ulike kompetanser
-- En person kan ha flere kompetanser i samme produksjon
-- En person kan være med i flere produksjoner
CREATE TABLE IF NOT EXISTS produksjon_bemanning (
    id SERIAL PRIMARY KEY,
    produksjon_id INTEGER NOT NULL REFERENCES produksjon(id) ON DELETE CASCADE,
    person_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    talent_navn VARCHAR(100) NOT NULL,
    talent_kategori_sti TEXT NOT NULL,
    notater TEXT,
    status VARCHAR(50) DEFAULT 'planlagt',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (produksjon_id, person_id, talent_navn)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_facebook_id ON users(facebook_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_talent_kategori_id ON talent(kategori_id);
CREATE INDEX idx_talent_leder_id ON talent(leder_id);
CREATE INDEX idx_talentkategori_parent_id ON talentkategori(parent_id);
CREATE INDEX idx_talentkategori_navn ON talentkategori(navn);
CREATE INDEX idx_bruker_talent_bruker_id ON bruker_talent(bruker_id);
CREATE INDEX idx_bruker_talent_talent_id ON bruker_talent(talent_id);
CREATE INDEX idx_bruker_talent_erfaringsnivaa ON bruker_talent(erfaringsnivaa);
-- kategori_id er fjernet (produksjon er selvstendig etter opprettelse)
CREATE INDEX idx_produksjon_plan_id ON produksjon(plan_id);
CREATE INDEX idx_produksjon_tid ON produksjon(tid);
CREATE INDEX idx_produksjon_publisert ON produksjon(publisert);
CREATE INDEX idx_produksjonskategori_navn ON produksjonskategori(navn);
CREATE INDEX idx_produksjonsplan_start_dato ON produksjonsplan(start_dato);
CREATE INDEX idx_produksjonsplan_slutt_dato ON produksjonsplan(slutt_dato);
CREATE INDEX idx_produksjon_bemanning_produksjon_id ON produksjon_bemanning(produksjon_id);
CREATE INDEX idx_produksjon_bemanning_person_id ON produksjon_bemanning(person_id);
CREATE INDEX idx_produksjon_bemanning_talent_id ON produksjon_bemanning(talent_id);
CREATE INDEX idx_produksjonskategori_talent_mal_kategori_id ON produksjonskategori_talent_mal(kategori_id);
CREATE INDEX idx_produksjonskategori_talent_mal_talent_id ON produksjonskategori_talent_mal(talent_id);
CREATE INDEX idx_produksjonskategori_plan_mal_element_kategori_id ON produksjonskategori_plan_mal_element(kategori_id);
CREATE INDEX idx_produksjonskategori_plan_mal_element_parent_id ON produksjonskategori_plan_mal_element(parent_id);
CREATE INDEX idx_produksjonskategori_plan_mal_element_sort_order ON produksjonskategori_plan_mal_element(kategori_id, parent_id, rekkefølge);
CREATE INDEX idx_produksjonskategori_oppmote_mal_kategori_id ON produksjonskategori_oppmote_mal(kategori_id);
CREATE INDEX idx_produksjonskategori_oppmote_mal_sort_order ON produksjonskategori_oppmote_mal(kategori_id, rekkefølge);
CREATE INDEX idx_produksjon_plan_element_produksjon_id ON produksjon_plan_element(produksjon_id);
CREATE INDEX idx_produksjon_plan_element_parent_id ON produksjon_plan_element(parent_id);
CREATE INDEX idx_produksjon_plan_element_sort_order ON produksjon_plan_element(produksjon_id, parent_id, rekkefølge);
CREATE INDEX idx_produksjon_oppmote_produksjon_id ON produksjon_oppmote(produksjon_id);
CREATE INDEX idx_produksjon_oppmote_tidspunkt ON produksjon_oppmote(tidspunkt);
CREATE INDEX idx_produksjon_oppmote_sort_order ON produksjon_oppmote(produksjon_id, rekkefølge);
CREATE INDEX idx_produksjon_talent_behov_produksjon_id ON produksjon_talent_behov(produksjon_id);
CREATE INDEX idx_produksjon_talent_behov_talent_id ON produksjon_talent_behov(talent_id);

