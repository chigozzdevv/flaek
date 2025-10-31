import { Router } from 'express';
import { authController } from '@/features/auth/auth.controller';
import { schemaValidator } from '@/middlewares/schema-validator';
import { signupSchema, loginSchema, verifyTotpSchema } from '@/features/auth/auth.validators';
import { resetPasswordRequestSchema, resetPasswordConfirmSchema } from '@/features/auth/auth.validators';
import { asyncHandler } from '@/utils/async-handler';
import { jwtAuth } from '@/middlewares/jwt-auth';
import { changePasswordSchema, totpVerifyJwtSchema, totpDisableSchema } from '@/features/auth/auth.validators';

const router = Router();
router.post('/signup', schemaValidator(signupSchema), asyncHandler(authController.signup));
router.post('/verify-totp', schemaValidator(verifyTotpSchema), asyncHandler(authController.verifyTotp));
router.post('/login', schemaValidator(loginSchema), asyncHandler(authController.login));
router.post('/logout', authController.logout);
router.post('/reset-password/request', schemaValidator(resetPasswordRequestSchema), asyncHandler(authController.resetPasswordRequest));
router.post('/reset-password/confirm', schemaValidator(resetPasswordConfirmSchema), asyncHandler(authController.resetPasswordConfirm));

router.get('/me', jwtAuth, asyncHandler(authController.me));
router.post('/change-password', jwtAuth, schemaValidator(changePasswordSchema), asyncHandler(authController.changePassword));
router.post('/totp/setup', jwtAuth, asyncHandler(authController.totpSetup));
router.post('/totp/verify', jwtAuth, schemaValidator(totpVerifyJwtSchema), asyncHandler(authController.totpVerifyJwt));
router.post('/totp/disable', jwtAuth, schemaValidator(totpDisableSchema), asyncHandler(authController.totpDisable));

export const authRoutes = router;
