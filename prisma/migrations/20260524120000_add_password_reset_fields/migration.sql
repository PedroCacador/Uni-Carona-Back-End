-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3);
