import axios from 'axios';
import instance from '../axios/axios.instance';
import { getErrorMessage } from '@/lib/utils';
import { getUserRoleFromUnknown, type UserRole } from '@/lib/auth/roles';

export type VerifyOtpResponse = {
  role: UserRole | null;
  raw: unknown;
};

export async function verifyOtpApi(otp: string): Promise<VerifyOtpResponse> {
  try {
    const res = await instance.post('/auth/verify-otp', { otp });
    const data = res.data?.data ?? res.data;

    return {
      role: getUserRoleFromUnknown(data),
      raw: data,
    };
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
