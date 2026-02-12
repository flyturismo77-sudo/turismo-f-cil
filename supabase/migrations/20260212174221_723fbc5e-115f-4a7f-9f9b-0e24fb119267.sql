-- Fix vagas_ocupadas to match actual client counts for all viagens
UPDATE viagens SET vagas_ocupadas = sub.total
FROM (
  SELECT v.id, COUNT(c.id)::int as total
  FROM viagens v
  LEFT JOIN clientes c ON c.id_viagem = v.id
  GROUP BY v.id
) sub
WHERE viagens.id = sub.id;