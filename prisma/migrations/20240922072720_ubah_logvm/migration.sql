/*
  Warnings:

  - Added the required column `divisi` to the `LogVM` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `LogVM` ADD COLUMN `divisi` VARCHAR(191) NOT NULL;
