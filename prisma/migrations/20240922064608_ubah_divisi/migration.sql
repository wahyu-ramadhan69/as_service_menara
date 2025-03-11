/*
  Warnings:

  - A unique constraint covering the columns `[nama]` on the table `Divisi` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Divisi_nama_key` ON `Divisi`(`nama`);
