#!/usr/bin/env bash
set -euo pipefail

cd /root/appathy/crm
/usr/bin/node --env-file=/root/appathy/crm/.env --import tsx /root/appathy/crm/scripts/run-reminders.ts
