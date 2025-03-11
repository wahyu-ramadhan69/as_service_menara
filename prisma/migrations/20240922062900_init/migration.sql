-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'HEAD', 'ADMIN') NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `id_divisi` INTEGER NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Divisi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `cpu` INTEGER NOT NULL,
    `storage` INTEGER NOT NULL,
    `ram` INTEGER NOT NULL,
    `nama_storage` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pengajuan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_template` INTEGER NOT NULL,
    `cpu` INTEGER NULL,
    `ram` INTEGER NULL,
    `storage` INTEGER NULL,
    `segment` VARCHAR(191) NULL,
    `status_pengajuan` VARCHAR(191) NOT NULL,
    `nama_aplikasi` VARCHAR(191) NOT NULL,
    `tanggal_pengajuan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggal_perubahan` DATETIME(3) NOT NULL,
    `tujuan_pengajuan` VARCHAR(191) NOT NULL,
    `jenis_pengajuan` ENUM('New', 'Existing', 'Delete', 'Perubahan') NOT NULL,
    `vmid` INTEGER NULL,
    `nodes` VARCHAR(191) NULL,
    `nama_baru` VARCHAR(191) NULL,
    `vmid_old` INTEGER NULL,
    `user` VARCHAR(191) NOT NULL,
    `divisi` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Server` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vmid` INTEGER NOT NULL,
    `segment` VARCHAR(191) NULL,
    `id_ip` INTEGER NOT NULL,
    `id_template` INTEGER NOT NULL,
    `user` VARCHAR(191) NOT NULL,
    `divisi` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Server_vmid_key`(`vmid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IpAddress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(191) NOT NULL,
    `nama_server` VARCHAR(191) NULL,
    `status` ENUM('AVAILABLE', 'NOT_AVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    `type` ENUM('INTERNAL', 'BACKEND', 'FRONTEND') NOT NULL,

    UNIQUE INDEX `IpAddress_ip_key`(`ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_template` VARCHAR(191) NOT NULL,
    `type_os` VARCHAR(191) NOT NULL,
    `vmid` INTEGER NOT NULL,
    `nodes` VARCHAR(191) NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `tanggal_dibuat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `templates_vmid_key`(`vmid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LogVM` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(191) NOT NULL,
    `activity` ENUM('PowerOff', 'PowerOn', 'Restart', 'Console', 'IPSync') NOT NULL,
    `vmid` INTEGER NOT NULL,
    `tujuan` VARCHAR(191) NULL,
    `tanggal_activity` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_id_divisi_fkey` FOREIGN KEY (`id_divisi`) REFERENCES `Divisi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pengajuan` ADD CONSTRAINT `Pengajuan_id_template_fkey` FOREIGN KEY (`id_template`) REFERENCES `templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Server` ADD CONSTRAINT `Server_id_ip_fkey` FOREIGN KEY (`id_ip`) REFERENCES `IpAddress`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Server` ADD CONSTRAINT `Server_id_template_fkey` FOREIGN KEY (`id_template`) REFERENCES `templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
