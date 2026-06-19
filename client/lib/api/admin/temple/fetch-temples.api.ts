import { getErrorMessage } from '@/lib/utils';
import instance from '../../axios/axios.instance';
import axios from 'axios';

export default async function FetchTempleApi() {
  try {
    const res = await instance.get('/temples');
    return res.data?.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        getErrorMessage(
          error.response?.data?.message,
          "temple fetch failed. Please try again.",
        ),
      );
    }

    throw new Error(getErrorMessage(error));
  }
}