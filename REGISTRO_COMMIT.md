## 2024-XX-XX
- Backend synchronous percentile calculation when updating measurements and babies.
- Added `PATCH /babies/{id}?syncRecalc=1` and inline percentile computation.
- Frontend removed polling; now relies on single HTTP responses.
