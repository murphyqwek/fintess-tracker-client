export interface User {
    id: string;
    login: string;
}

export interface UserProfile {
  login: string;
  name: string | null;
  birthDay: string | null;
  height: number | null;
  weight: number | null;
}