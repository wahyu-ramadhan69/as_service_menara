-- DropIndex
DROP INDEX `User_email_key` ON `User`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `jenis` ENUM('Ldap', 'Local') NULL,
    MODIFY `password` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;
