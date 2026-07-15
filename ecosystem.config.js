module.exports = {
  apps: [
    {
      name: "appathy",
      cwd: "/root/appathy",
      script: "npm",
      args: "start -- --hostname 127.0.0.1 --port 3004",
      // DATABASE_URL and JWT_SECRET come from .env (loaded by Next.js);
      // never hardcode secrets here — this file is committed.
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
