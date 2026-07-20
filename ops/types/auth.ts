export type OpsOperator = {
  id: string;
  name: string;
  username: string;
  role: "OWNER" | "ADMIN" | "OPERATOR" | "FINANCE" | "SUPPORT";
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  operator: OpsOperator;
};