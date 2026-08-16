import container from "@/config/container";
export class RepositoryFactory {
  private static repoMap: Record<string, any> | null = null;

  /**
   * Lấy tất cả tenant repositories
   * Map entity name -> repository instance
   */
  static getRepositories(): Record<string, any> {
    // Cache lại để không phải get nhiều lần
    if (this.repoMap) {
      return this.repoMap;
    }

    this.repoMap = {};

    return this.repoMap;
  }

  /**
   * Reset cache (dùng khi cần refresh repositories)
   */
  static reset(): void {
    this.repoMap = null;
  }
}
