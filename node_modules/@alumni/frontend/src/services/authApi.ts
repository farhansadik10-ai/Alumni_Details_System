import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string) {
  const res = await axios.post(
    `${API_URL}/api/auth/login`,
    { email, password }
  );

  return res.data;
}