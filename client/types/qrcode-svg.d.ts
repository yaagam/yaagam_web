declare module "qrcode" {
  export function toString(
    text: string,
    options: {
      type: "svg";
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
      margin?: number;
      width?: number;
      color?: {
        dark?: string;
        light?: string;
      };
    },
  ): Promise<string>;
}
