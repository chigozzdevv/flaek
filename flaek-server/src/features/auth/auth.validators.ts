import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    orgName: z.string().min(2),
  }).refine((d) => d.password === d.confirmPassword, { message: 'passwords_do_not_match', path: ['confirmPassword'] }),
});

export const verifyTotpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().min(6).max(6),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    code: z.string().min(6).max(6).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  }).refine((d) => d.newPassword === d.confirmNewPassword, { message: 'passwords_do_not_match', path: ['confirmNewPassword'] }),
});

export const totpVerifyJwtSchema = z.object({
  body: z.object({ code: z.string().min(6).max(6) }),
});

export const totpDisableSchema = z.object({
  body: z.object({ code: z.string().min(6).max(6) }),
});

export const resetPasswordRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordConfirmSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  }).refine((d) => d.password === d.confirmPassword, { message: 'passwords_do_not_match', path: ['confirmPassword'] }),
});
