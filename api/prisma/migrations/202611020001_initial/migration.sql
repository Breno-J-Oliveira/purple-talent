CREATE TYPE "Role" AS ENUM ('CANDIDATE', 'RECRUITER', 'ADMIN');
CREATE TYPE "Track" AS ENUM ('RED', 'BLUE', 'PURPLE');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Session" (
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash")
);
CREATE TABLE "Candidate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "track" "Track" NOT NULL,
  "bio" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "skills" TEXT[],
  CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Challenge" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "track" "Track" NOT NULL,
  "points" INTEGER NOT NULL,
  "difficulty" TEXT NOT NULL,
  "flagHash" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Challenge_positive_points" CHECK ("points" > 0)
);
CREATE TABLE "Submission" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "writeup" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Submission_positive_points" CHECK ("points" > 0)
);
CREATE TABLE "Job" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "track" "Track" NOT NULL,
  "location" TEXT NOT NULL,
  "requirements" TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "Candidate_userId_key" ON "Candidate"("userId");
CREATE UNIQUE INDEX "Candidate_handle_key" ON "Candidate"("handle");
CREATE UNIQUE INDEX "Submission_candidateId_challengeId_key" ON "Submission"("candidateId", "challengeId");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
