declare module "pdf-parse/lib/pdf-parse.js" {
  function pdfParse(
    dataBuffer: Buffer | Uint8Array | ArrayBuffer,
    options?: {
      pagerender?: (pageData: unknown) => Promise<string>;
      max?: number;
      version?: string;
    },
  ): Promise<{
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    text: string;
    version: string;
  }>;

  export default pdfParse;
}
