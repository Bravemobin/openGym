# رابط برنامه‌نویسی وب (HTTP API)

رابط برنامه‌نویسی وب کامل openGym — تمام مسیرهای `api/server.js`، همراه با احراز هویت، شِماهای درخواست/پاسخ و رفتارهای وابسته به متغیرهای محیطی — به‌صورت یک مشخصه دست‌نویس OpenAPI 3.1 مستند شده است:

- **مشخصه (منبع اصلی و مرجع):** [`api/openapi.yaml`](../api/openapi.yaml)
- **نمایش تعاملی (Swagger UI):** https://opengym.duarte-santos.ch/api.html

پس از تغییر مسیرها (routes)، آن را اعتبارسنجی (lint) کنید:

```sh
npx --yes @redocly/cli lint api/openapi.yaml
```
