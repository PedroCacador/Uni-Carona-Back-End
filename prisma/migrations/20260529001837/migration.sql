/*
  Warnings:

  - You are about to drop the column `whatsapp` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "whatsapp",
ADD COLUMN     "matricula" TEXT;
