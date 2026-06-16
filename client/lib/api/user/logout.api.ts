import axios from 'axios';
import instance from '../axios/axios.instance';
import { getErrorMessage } from '@/lib/utils';

export async function logoutApi() {
  try {
    const res = await instance.post('/auth/logout', {});
    return res.data?.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        getErrorMessage(
          error.response?.data?.message,
          "Logout failed. Please try again.",
        ),
      );
    }

    throw new Error(getErrorMessage(error));
  }
}
