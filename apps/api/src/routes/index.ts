import { Router } from 'express';
import { authRouter } from './auth.routes';
import { transactionsRouter } from './transactions.routes';
import { verificationRouter } from './verification.routes';
import { adminRouter } from './admin.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/transactions', transactionsRouter);
apiRouter.use('/verify', verificationRouter);
apiRouter.use('/admin', adminRouter);
