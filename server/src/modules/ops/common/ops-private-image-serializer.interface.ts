export interface IOpsPrivateImageSerializer {
  serialize<T>(value: T): Promise<T>;
}
