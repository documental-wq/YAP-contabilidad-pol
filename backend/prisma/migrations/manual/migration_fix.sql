-- Corrige tasas base que quedaron con capital_inicial en producción
UPDATE "TasaInteres" SET aplica_sobre = 'saldo_pendiente' WHERE aplica_sobre = 'capital_inicial';
-- Corrige snapshots de préstamos ya creados
UPDATE "PrestamTasa" SET aplica_sobre_snapshot = 'saldo_pendiente' WHERE aplica_sobre_snapshot = 'capital_inicial';
