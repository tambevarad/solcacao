let token: string | null = null;
export const sessionToken = {
  get: () => token,
  set: (value: string | null) => {
    token = value;
  },
};
