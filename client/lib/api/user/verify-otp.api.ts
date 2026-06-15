import axios from 'axios';
import instance from '../axios/axios.instance';
import { getErrorMessage } from '@/lib/utils';

export async function verifyOtpApi(otp: string) {
  try {
    const res = await instance.post('/auth/verify-otp', { otp });
    return res.data?.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        getErrorMessage(
          error.response?.data?.message,
          'OTP verification failed. Please try again.',
        ),
      );
    }

    throw new Error(getErrorMessage(error));
  }
}
