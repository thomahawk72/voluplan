-- Nyttige SQL-queries for Voluplan
-- ====================================

-- PRODUKSJONER
-- ============

-- 1. Liste alle produksjoner med full informasjon
SELECT 
  p.id,
  p.navn,
  p.tid,
  pk.navn AS kategori,
  pp.navn AS plan,
  p.publisert,
  p.beskrivelse,
  COUNT(DISTINCT pb.person_id) AS antall_personer
FROM produksjon p
LEFT JOIN produksjonskategori pk ON p.kategori_id = pk.id
LEFT JOIN produksjonsplan pp ON p.plan_id = pp.id
LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
GROUP BY p.id, p.navn, p.tid, pk.navn, pp.navn, p.publisert, p.beskrivelse
ORDER BY p.tid;

-- 2. Liste alle personer og kompetanser for en bestemt produksjon
SELECT 
  p.navn AS produksjon,
  p.tid,
  u.first_name || ' ' || u.last_name AS person,
  u.email,
  k.navn AS kompetanse,
  kat.navn AS kompetansekategori,
  pb.status,
  pb.notater
FROM produksjon_bemanning pb
JOIN produksjon p ON pb.produksjon_id = p.id
JOIN users u ON pb.person_id = u.id
JOIN kompetanse k ON pb.kompetanse_id = k.id
JOIN kompetansekategori kat ON k.kategori_id = kat.id
WHERE p.id = :produksjon_id
ORDER BY kat.navn, k.navn, u.last_name, u.first_name;

-- 3. Liste alle produksjoner en person er satt opp på
SELECT 
  u.first_name || ' ' || u.last_name AS person,
  p.navn AS produksjon,
  p.tid,
  pk.navn AS produksjonskategori,
  k.navn AS kompetanse,
  kat.navn AS kompetansekategori,
  pb.status,
  p.publisert
FROM produksjon_bemanning pb
JOIN produksjon p ON pb.produksjon_id = p.id
JOIN produksjonskategori pk ON p.kategori_id = pk.id
JOIN users u ON pb.person_id = u.id
JOIN kompetanse k ON pb.kompetanse_id = k.id
JOIN kompetansekategori kat ON k.kategori_id = kat.id
WHERE u.id = :person_id
ORDER BY p.tid, p.navn;

-- 4. Finn ledige/manglende kompetanser for en produksjon
-- (Alle kompetanser som ikke er tildelt i produksjonen)
SELECT 
  k.id,
  k.navn AS kompetanse,
  kat.navn AS kategori,
  u.first_name || ' ' || u.last_name AS leder
FROM kompetanse k
LEFT JOIN kompetansekategori kat ON k.kategori_id = kat.id
LEFT JOIN users u ON k.leder_id = u.id
WHERE k.id NOT IN (
  SELECT DISTINCT kompetanse_id 
  FROM produksjon_bemanning 
  WHERE produksjon_id = :produksjon_id
)
ORDER BY kat.navn, k.navn;

-- STATISTIKK
-- ==========

-- 5. Antall produksjoner per person
SELECT 
  u.first_name || ' ' || u.last_name AS person,
  COUNT(DISTINCT pb.produksjon_id) AS antall_produksjoner,
  COUNT(pb.id) AS antall_oppgaver
FROM users u
LEFT JOIN produksjon_bemanning pb ON u.id = pb.person_id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY antall_produksjoner DESC, person;

-- 6. Mest brukte kompetanser
SELECT 
  k.navn AS kompetanse,
  kat.navn AS kategori,
  COUNT(pb.id) AS antall_ganger_brukt,
  COUNT(DISTINCT pb.person_id) AS antall_personer
FROM kompetanse k
LEFT JOIN kompetansekategori kat ON k.kategori_id = kat.id
LEFT JOIN produksjon_bemanning pb ON k.id = pb.kompetanse_id
GROUP BY k.id, k.navn, kat.navn
ORDER BY antall_ganger_brukt DESC;

-- 7. Kommende produksjoner (publiserte)
SELECT 
  p.navn,
  p.tid,
  pk.navn AS kategori,
  COUNT(DISTINCT pb.person_id) AS antall_personer_påmeldt
FROM produksjon p
LEFT JOIN produksjonskategori pk ON p.kategori_id = pk.id
LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
WHERE p.publisert = true
  AND p.tid > NOW()
GROUP BY p.id, p.navn, p.tid, pk.navn
ORDER BY p.tid;

-- KOMPETANSE
-- ==========

-- 8. Liste alle kompetanser med ledere
SELECT 
  k.navn AS kompetanse,
  kat.navn AS kategori,
  u.first_name || ' ' || u.last_name AS leder,
  u.email AS leder_epost,
  k.beskrivelse
FROM kompetanse k
LEFT JOIN kompetansekategori kat ON k.kategori_id = kat.id
LEFT JOIN users u ON k.leder_id = u.id
ORDER BY kat.navn, k.navn;

-- 9. Personer med spesifikk kompetanse
SELECT 
  k.navn AS kompetanse,
  u.first_name || ' ' || u.last_name AS person,
  u.email,
  COUNT(pb.id) AS antall_ganger_brukt
FROM kompetanse k
JOIN produksjon_bemanning pb ON k.id = pb.kompetanse_id
JOIN users u ON pb.person_id = u.id
WHERE k.id = :kompetanse_id
GROUP BY k.id, k.navn, u.id, u.first_name, u.last_name, u.email
ORDER BY antall_ganger_brukt DESC;

-- PRODUKSJONSPLANER
-- =================

-- 10. Produksjoner per plan
SELECT 
  pp.navn AS plan,
  pp.start_dato,
  pp.slutt_dato,
  COUNT(p.id) AS antall_produksjoner,
  COUNT(DISTINCT pb.person_id) AS antall_personer_involvert
FROM produksjonsplan pp
LEFT JOIN produksjon p ON pp.id = p.plan_id
LEFT JOIN produksjon_bemanning pb ON p.id = pb.produksjon_id
GROUP BY pp.id, pp.navn, pp.start_dato, pp.slutt_dato
ORDER BY pp.start_dato;

