-- Reset all existing users to require email verification
-- Run this SQL script to ensure all users must verify their email on next login

UPDATE [dbo].[Users]
SET [is_verified] = 0
WHERE [is_verified] = 1;

-- Optional: Clear any old verification codes
DELETE FROM [dbo].[EmailVerificationCodes]
WHERE [expires_at] < GETUTCDATE() OR [used] = 1;

PRINT 'All users have been reset to require email verification.';

