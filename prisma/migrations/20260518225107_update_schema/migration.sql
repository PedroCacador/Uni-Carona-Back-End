-- AlterTable
ALTER TABLE "Carona" ADD COLUMN     "distanciaMetros" INTEGER,
ADD COLUMN     "duracaoSegundos" INTEGER,
ADD COLUMN     "latitudeDestino" DOUBLE PRECISION,
ADD COLUMN     "latitudeOrigem" DOUBLE PRECISION,
ADD COLUMN     "longitudeDestino" DOUBLE PRECISION,
ADD COLUMN     "longitudeOrigem" DOUBLE PRECISION,
ADD COLUMN     "rotaPolyline" TEXT;
