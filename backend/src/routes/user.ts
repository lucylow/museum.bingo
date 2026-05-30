import express, { Request, Response } from 'express';
import { db, FieldValue } from '../config/firebase';
import { AuthenticatedRequest, verifyFirebaseToken } from '../middleware/auth';

const router = express.Router();

router.get('/me', verifyFirebaseToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ error: 'No authenticated user' });
    return;
  }

  const userDoc = await db.collection('users').doc(user.uid).get();
  if (!userDoc.exists) {
    const newUser = {
      uid: user.uid,
      email: user.email ?? null,
      displayName: null,
      photoURL: null,
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(user.uid).set(newUser);
    res.json(newUser);
    return;
  }

  res.json(userDoc.data());
});

export default router;
