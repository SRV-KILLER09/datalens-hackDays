-- Alter user table to add username and contact fields
ALTER TABLE "user" ADD COLUMN "username" text;
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");
ALTER TABLE "user" ADD COLUMN "contact" text;
