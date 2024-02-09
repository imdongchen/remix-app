/*
  Warnings:

  - You are about to drop the column `zip` on the `Address` table. All the data in the column will be lost.
  - Added the required column `zipCode` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Address" ("addressLine1", "addressLine2", "city", "country", "createdAt", "id", "state", "updatedAt") SELECT "addressLine1", "addressLine2", "city", "country", "createdAt", "id", "state", "updatedAt" FROM "Address";
DROP TABLE "Address";
ALTER TABLE "new_Address" RENAME TO "Address";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
