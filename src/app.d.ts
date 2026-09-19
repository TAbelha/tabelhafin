declare global {
  namespace App {
    interface Locals {
      userId: string | null;
      session: {
        user: { id: string; name: string; email: string };
        session: { id: string; token: string };
      } | null;
    }

    interface Platform {
      env: Env;
      context: ExecutionContext;
    }
  }
}

export {};
