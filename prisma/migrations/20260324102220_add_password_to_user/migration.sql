/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- Truncate existing rows before adding required column
TRUNCATE TABLE "User";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;
