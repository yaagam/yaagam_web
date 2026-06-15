import axios from 'axios';
import instance from '../axios/axios.instance';
import { getErrorMessage } from '@/lib/utils';

export async function sendOtpApi(whatsappNumber: string) {
  try {
    const res = await instance.post('/auth/send-otp', { whatsappNumber });
    return res.data?.data;
  } catch(error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        getErrorMessage(
          error.response?.data?.message,
          "Login failed. Please try again.",
        ),
      );
    }

    throw new Error(getErrorMessage(error));
  }
}
