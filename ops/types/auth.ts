export type OpsOperator = {
  id: string;
  name: string;
  username: string;
  role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "OPERATOR" | "OPERATIONS" | "FINANCE" | "SUPPORT";
};

export type OpsAuthResponse = {
  operatorId: string;
  username: string;
  role: OpsOperator["role"];
};