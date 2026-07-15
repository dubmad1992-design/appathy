module.exports = {
  apps: [
    {
      name: "appathy",
      cwd: "/root/appathy",
      script: "npm",
      args: "start -- --hostname 127.0.0.1 --port 3004",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "file:/root/appathy/prisma/dev.db",
        JWT_SECRET: "upkdciFGhaoC7MeeYKYOg2BLW4xWyNTjukj3jKlyB7pCuRbLAzJnBZbHeEjvY9v8"
      }
    }
  ]
};
