import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next-broken-20260330-2047/**", ".next_broken_1774272244/**", ".next_failed_1774272447/**", ".next_old/**", ".scf_deploy_work/**"]
  }
];

export default eslintConfig;
